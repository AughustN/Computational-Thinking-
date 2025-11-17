import requests
import json
# Lấy data theo toạ độ tâm và bán kính (Hình tròn)
def get_roads_query_by_radius(center_lat, center_lon, radius):
    query = f"""
    [out:json][timeout:180];
    (
      way["highway"](around:{int(radius)},{center_lat},{center_lon});
      node(w);
    );
    out body;
    """
    return query

#Lấy data đường xe cơ giới ở HCM
def get_roads_query_hcm_car():
    query = """
    [out:json][timeout:300];
    (
      way
        ["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service"]
        ["motor_vehicle"!="no"]
        ["motorcar"!="no"]
        ["access"!="no"]
        ["service"!~"parking_aisle|driveway|private"]
        ["highway"!~"footway|cycleway|path|steps|pedestrian|track|bridleway"]
        (area:3601973756);
    );
    out body;
    >;
    out skel qt;
    """
    return query


#Lấy data đường xe gắn máy ở HCM
def get_roads_query_hcm_motorbike():
    query = """
    [out:json][timeout:300];
    (
      way
        ["highway"~"trunk|primary|secondary|tertiary|unclassified|residential|service|living_street"]
        ["motorcycle"!="no"]
        ["access"!="no"]
        ["motor_vehicle"!="no"]
        ["highway"!~"motorway|motorway_link|footway|cycleway|path|steps|pedestrian|track|bridleway"]
        (area:3601973756);
    );
    out body;
    >;
    out skel qt;
    """
    return query


#Lấy data đường xe đạp ở HCM
def get_roads_query_hcm_bicycle():
    query = """
    [out:json][timeout:300];
    (
      way
        ["highway"~"cycleway|path|living_street|residential|service|unclassified|tertiary|secondary|primary|trunk"]
        ["highway"!~"motorway|motorway_link"]
        ["access"!="no"]
        ["bicycle"!="no"]
        (area:3601973756);
    );
    out body;
    >;
    out skel qt;
    """
    return query



def get_roads_query_hcm_walk():
    query = """
    [out:json][timeout:300];
    (
      way
        ["highway"~"footway|path|pedestrian|living_street|residential|service|track|unclassified|secondary|tertiary|primary|trunk"]
        ["highway"!~"motorway|motorway_link"]
        ["access"!="no"]
        ["foot"!~"no"]
        (area:3601973756);
    );
    out body;
    >;
    out skel qt;
    """
    return query



# ---------------- Overpass raw data ----------------
def extract_raw_data_from_OSM(built_query, transport):
    #2 link để dự phòng
    overpass_url = "https://overpass.kumi.systems/api/interpreter"
    #overpass_url = "http://overpass-api.de/api/interpreter"
    response = requests.get(overpass_url, params={'data': built_query})
    json_data = response.json()
    with open(transport, "w") as outfile:
        json.dump(json_data, outfile)
    print("✅ Dữ liệu bản đồ đã lưu dưới tên: " + transport)
    return json_data

if __name__ == "__main__":
    data_Car = extract_raw_data_from_OSM(get_roads_query_hcm_car(), "car_data.json")
    data_Walk = extract_raw_data_from_OSM(get_roads_query_hcm_walk(), "bicycle_data.json")
