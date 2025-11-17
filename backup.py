import json
import pandas as pd
import networkx as nx
import heapq
import folium
import math
from collections import defaultdict
from draw_bus_path import find_shortest_path , build_graph_from_json

# --------------------------------------------------------------
# 1. Load data
# --------------------------------------------------------------
def load_data():
    routes = pd.read_csv("routes.csv")
    trips  = pd.read_csv("trips.csv")
    stops  = pd.read_csv("stops.csv").set_index("stopId")
    return routes, trips, stops


# --------------------------------------------------------------
# 2. Build graph
# --------------------------------------------------------------
def build_graph(trips):
    G = nx.MultiDiGraph()
    for route_id in trips["routeId"].unique():
        sub = trips[trips["routeId"] == route_id].sort_values("stopSequence")
        stops_list = sub["stopId"].tolist()
        distances  = sub["distanceToNextStop"].tolist()
        for i in range(len(stops_list)-1):
            u = stops_list[i]
            v = stops_list[i+1]
            G.add_edge(u, v, distance=distances[i], route=route_id)
        for sid in stops_list:
            if sid not in G:
                G.add_node(sid)
    return G


# --------------------------------------------------------------
# 3. Route info (fare + headway)
# --------------------------------------------------------------
def build_route_info(routes, trips, stops_df):
    info = {}
    for _, row in routes.iterrows():
        rid = row["routeId"]
        headway_min = row["busStopSpacing(time of trip)"]
        # Find first and last stop name for this route
        sub = trips[trips["routeId"] == rid].sort_values("stopSequence")
        if not sub.empty:
            first_stop = stops_df.loc[sub.iloc[0]["stopId"], "stopName"]
            last_stop  = stops_df.loc[sub.iloc[-1]["stopId"], "stopName"]
            trip_name = f"{first_stop} → {last_stop}"
        else:
            trip_name = "Unknown"
        info[rid] = {
            "bus_number" : row["busNumber"],
            "fare": row["fee"],
            "headway_sec": headway_min * 60,
            "trip_name": trip_name
        }
    return info


# --------------------------------------------------------------
# 4. Helpers
# --------------------------------------------------------------
def haversine(c1, c2):
    lat1, lon1 = math.radians(c1[0]), math.radians(c1[1])
    lat2, lon2 = math.radians(c2[0]), math.radians(c2[1])
    dlat, dlon = lat2-lat1, lon2-lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 6371000 * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def nearby_stops(coord, stops_df, max_dist):
    res = []
    for sid, row in stops_df.iterrows():
        d = haversine(coord, (row["lat"], row["lng"]))
        if d <= max_dist:
            res.append((sid, d))
    return res

def make_heuristic(stops_df, dest_coord, speed):
    def h(sid):
        sc = (stops_df.loc[sid, "lat"], stops_df.loc[sid, "lng"])
        return haversine(sc, dest_coord) / speed
    return h


def a_star(G, route_info, start_stops, dest_stop_set, heuristic,
                speed, walk_speed, c, p):
    """
    p = transfer penalty multiplier (3.0 = strong preference for no transfer)
    """
    open_set = []
    came_from = {}
    g_score = defaultdict(lambda: float('inf'))
    cum_fare = {}
    cum_wait = {}
    counter = 0

    for sid, walk_m in start_stops:
        state = (sid, None)
        g = walk_m / walk_speed
        g_score[state] = g
        f = g + heuristic(sid)
        heapq.heappush(open_set, (f, counter, state))
        came_from[state] = None
        cum_fare[state] = 0
        cum_wait[state] = 0
        counter += 1

    while open_set:
        _, _, current = heapq.heappop(open_set)
        stop, cur_route = current

        # === EARLY EXIT: if we reach a dest stop AND continuing is worse ===
        if stop in dest_stop_set:
            # Heuristic: straight-line to dest
            h_to_dest = heuristic(stop)
            current_to_dest = g_score[current] + h_to_dest

            # If any node in open_set has f >= current_to_dest → no better path
            if open_set and open_set[0][0] >= current_to_dest:
                # Reconstruct and return
                path = []
                routes_used = []
                state = current
                while state is not None:
                    for u, nei, key, data in G.out_edges(stop, data=True, keys=True):
                        dist = data["distance"]
                        new_route = data["route"]
                        if cur_route is None or cur_route != new_route: continue
                        new_h_to_dest = heuristic(nei)
                        if(heuristic(stop) > new_h_to_dest):
                            h_to_dest= new_h_to_dest
                            new_state = (nei, new_route)
                            g_score[new_state] = g_score[state] + dist/speed
                            came_from[new_state] = state
                            state = new_state
                        break
                    if(state == current): break
                                

                while state is not None:
                    s, r = state
                    if s is not None:
                        path.append(s)
                        if r is not None:
                            routes_used.append(r)
                    state = came_from[state]
                path.reverse()
                routes_used.reverse()

                total_fare = cum_fare[current]
                total_wait_sec = cum_wait[current]
                worst_sec = g_score[current] - c * total_fare - (p - 1)* total_wait_sec + h_to_dest * walk_speed
                best_sec = worst_sec - total_wait_sec

                return (path, routes_used, total_fare,
                        worst_sec / 60, best_sec / 60, total_wait_sec / 60)

        if stop not in G:
            continue

        for u, nei, key, data in G.out_edges(stop, data=True, keys=True):
            dist = data["distance"]
            new_route = data["route"]

            wait = 0.0
            fare_add = 0
            if cur_route is None or cur_route != new_route:
                fare_add = route_info[new_route]["fare"]
                wait = route_info[new_route]["headway_sec"]

            # STRONG PENALTY ON WAITING → FEWER TRANSFERS
            tentative_g = g_score[current] + dist/speed + wait * p + c * fare_add

            new_state = (nei, new_route)
            if tentative_g < g_score[new_state]:
                came_from[new_state] = current
                g_score[new_state] = tentative_g
                cum_fare[new_state] = cum_fare[current] + fare_add
                cum_wait[new_state] = cum_wait[current] + wait
                f = tentative_g + heuristic(nei)
                heapq.heappush(open_set, (f, counter, new_state))
                counter += 1

    return None

def draw_map(G, route_info, start_coord, dest_coord, stops_df,
             path, route_seq, total_fare, worst_min, best_min,
             Car_nodes, Car_graph, Walk_nodes, Walk_graph):
    m = folium.Map(location=start_coord, zoom_start=14, tiles="OpenStreetMap")
    folium.Marker(start_coord, popup="Start", icon=folium.Icon(color="green")).add_to(m)
    folium.Marker(dest_coord,  popup="End",   icon=folium.Icon(color="red")).add_to(m)

    if not path:
        m.save("bus_route_pro.html")
        return

    # === 1. Walk to first stop ===
    first_stop_coord = (stops_df.loc[path[0], "lat"], stops_df.loc[path[0], "lng"])
    walk_to_bus = find_shortest_path(
        start_coord[0], start_coord[1],
        first_stop_coord[0], first_stop_coord[1],
        Walk_nodes, Walk_graph
    )
    if walk_to_bus:
        folium.PolyLine(walk_to_bus, color="gray", weight=5, opacity=0.8, tooltip="Walk").add_to(m)
        prev_end_coord = walk_to_bus[-1]
    else:
        folium.PolyLine([start_coord, first_stop_coord], color="gray", weight=5, opacity=0.8).add_to(m)
        prev_end_coord = first_stop_coord

    # === 2. Bus segments (CHAINED) ===
    colors = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f"]
    color_map = {}
    col_idx = 0

    for i in range(len(path)-1):
        u, v = path[i], path[i+1]
        v_coord = (stops_df.loc[v, "lat"], stops_df.loc[v, "lng"])
        edge_route = route_seq[i] 

        if edge_route not in color_map:
            color_map[edge_route] = colors[col_idx % len(colors)]
            col_idx += 1
        color = color_map[edge_route]

        road_path = find_shortest_path(
            prev_end_coord[0], prev_end_coord[1],
            v_coord[0], v_coord[1],
            Car_nodes, Car_graph
        )

        if road_path:
            folium.PolyLine(road_path, color=color, weight=7, opacity=0.9,
                            tooltip=f"Bus {route_info[edge_route]['bus_number']}").add_to(m)
            prev_end_coord = road_path[-1]
        else:
            folium.PolyLine([prev_end_coord, v_coord], color=color, weight=7, opacity=0.6,
                            tooltip=f"Bus {route_info[edge_route]['bus_number']} (approx)").add_to(m)
            prev_end_coord = v_coord

    # === 3. Final walk ===
    walk_to_dest = find_shortest_path(
        prev_end_coord[0], prev_end_coord[1],
        dest_coord[0], dest_coord[1],
        Walk_nodes, Walk_graph
    )
    if walk_to_dest:
        folium.PolyLine(walk_to_dest, color="gray", weight=5, opacity=0.8, tooltip="Walk").add_to(m)
    else:
        folium.PolyLine([prev_end_coord, dest_coord], color="gray", weight=5, opacity=0.8).add_to(m)

    # === Legend ===
    legend_items = []
    for route_id in set(route_seq):
        if route_id is None: 
            continue
        color = color_map.get(route_id, "#000000")
        bus_num = route_info[route_id]["bus_number"]
        trip = route_info[route_id]["trip_name"]
        legend_items.append(
            f'<i style="background:{color};width:20px;height:4px;display:inline-block;"></i> '
            f'<b>Bus {bus_num}</b>: {trip}'
        )
    
    legend_html = f"""
    <div style="position:fixed; bottom:20px; left:20px; background:white; padding:15px; 
                border:2px solid gray; z-index:9999; font-size:14px; width:400px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
    <b>Cost-efficient Route</b><br>
    Fare: <b>{total_fare:,} VND</b><br>
    Worst case: <b>{worst_min:.1f} min</b><br>
    Best case: <b>{best_min:.1f} min</b><br>
    Transfers: <b>{len(set(r for r in route_seq if r is not None))-1}</b><br><br>
    <b>Legend:</b><br>
    {"<br>".join(legend_items)}
    </div>
    """
    m.get_root().html.add_child(folium.Element(legend_html))
    m.save("bus_route_pro.html")
    print("Map saved → bus_route_pro.html (MultiDiGraph + Real Roads!)")

# --------------------------------------------------------------
# 7. Main
# --------------------------------------------------------------
if __name__ == "__main__":
    # START_COORD = (10.7677, 106.6894)   # Bến xe buýt Sài Gòn
    # DEST_COORD  = (10.8437, 106.6134)   # Bến xe An Sương
    START_COORD = (10.76306747151454, 106.68247166704994)
    DEST_COORD = (10.875829782784104, 106.79923570326697)

    MAX_WALK    = 300
    SPEED_MPS   = 7.0
    WALK_SPEED  = 1.5
    C_FARE      = 100.0
    P_TRANSFER_PEN = 10000.0

    #load json data _ create car_graph & walk_graph
    with open("car_data.json", "r") as f:
        Car_data = json.load(f)

    Car_nodes, Car_graph = build_graph_from_json(Car_data)

    with open("walk_data.json", "r") as f:
        Walk_data = json.load(f)

    Walk_nodes, Walk_graph = build_graph_from_json(Walk_data)


    routes_df, trips_df, stops_df = load_data()
    G = build_graph(trips_df)
    route_info = build_route_info(routes_df, trips_df, stops_df)

    start_stops = nearby_stops(START_COORD, stops_df, MAX_WALK)
    dest_stops_list = nearby_stops(DEST_COORD, stops_df, MAX_WALK)

    
    dest_stop_set = {sid for sid, _ in dest_stops_list}

    heuristic = make_heuristic(stops_df, DEST_COORD, SPEED_MPS)

    result = a_star(G, route_info, start_stops, dest_stop_set, heuristic,
                    SPEED_MPS, WALK_SPEED, C_FARE, P_TRANSFER_PEN)

    if result is None:
        print("No route found!")
    else:
        path, route_seq, total_fare, worst_min, best_min, _ = result
        transfers = len(set(r for r in route_seq if r is not None)) - 1
        print(f"Total stop_id    : {path}")
        print(f"Total fare       : {total_fare:,} VND")
        print(f"Worst case ETA   : {worst_min:.1f} min")
        print(f"Best case ETA    : {best_min:.1f} min")
        print(f"Transfers        : {transfers}")
        print(f"Routes used      : {route_seq}")

        draw_map(G, route_info, START_COORD, DEST_COORD, stops_df,
            path, route_seq, total_fare, worst_min, best_min, Car_nodes, Car_graph, Walk_nodes, Walk_graph)
        
