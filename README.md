# All-In-One Urban Mobility Platform

> An open, modular project to plan and execute city trips end-to-end—routing, live recommendations, and safety alerts—in a single place. 

---

## Why this exists

* **Urban travel is fragmented across schedules, fares, and traffic data**, forcing users to juggle multiple apps and make suboptimal choices. 

---

## What we’re building (MVP scope)

* **A two-part web platform** separating pre-trip routing from in-trip recommendations, with a safety/alerting layer. 

  * Routing (pre-trip): generates 1–2 itineraries (e.g., *Fastest* and *Normal*) under user constraints.
  * Recommender (in-trip): live ETA/cost options with confidence scores in a kanban-style UI.
  * Safety & alerts: a corridor load index triggers context-aware warnings on congested segments. 
* **In-scope transport modes:** bus, taxi/ride-hail/motorbike, walking. Trains/flights are out-of-scope for MVP. 

---

## Success criteria (PoC)

* **Planning feasibility:** ≥90% of generated itineraries satisfy all hard constraints. 
* **User acceptance of plans:** ≥60% select one of the top-3 plans. 
* **In-trip performance:** on-time ≥80%, missed-connection ≤5%, cost error ≤12%. 
* **Safety value:** alert precision ≥80%, exposure to busy segments ≤15 min/day, CSAT ≥4.2/5. 

* **Additional PoC metrics & framing** (supporting notes we track during POC workstreams). 

  * Route optimization feasibility & acceptance rates.
  * Transport suggestion KPIs: cost error, on-time rate, missed connections.
  * Safety KPIs: exposure time, successful diversion rate, user safety score; suggested precision ≥80%, recall ≥70%.

---

## Phased approach we follow

* **Five PoC phases** to reduce risk and align stakeholders: need → ideation → evaluation → PoC design → presentation (with schedule, cost, success criteria, resources, training). 
* **Project timeline (production)** spans Design → Develop → Test → Deploy; see the *Gantt chart on page 7* and task breakdown on *pages 7–8* of the proposal. 

---

## System modules (repo mapping)

* **Routing** — pathfinding (e.g., Dijkstra/A*) + constraint solver; API consumed by UI & recommender. 
* **Suggestion & Ranking** — fuses routing, fares, and context to rank top options. 
* **Safety & Real-time** — corridor load, anomaly detection, alert policy. 
* **Interface (Web)** — React/Next.js-based UI for planning + in-trip board. 
> **Risk mitigations** we apply from day one: buffer heuristics for schedule/fare drift; label lower-confidence alerts when live signals are weak. 

---

## Data sources & city scope

* **Geography (PoC): one city (e.g., Hanoi or HCMC)** to keep integrations focused. 
* **Inputs** include start/end, allowed modes, optional constraints (walking limits, accessibility, budget) and localization. **Outputs** include itineraries and ranked bus suggestions with times and fares.
  
---

## Repository structure 

* `/apps/web` — Next.js app (planning + in-trip UI).
* `/services/routing` — routing/constraints service.
* `/services/recommender` — ranking, cost/ETA fusion.
* `/services/safety` — corridor load + alert policy.
* `/packages/shared` — types, config, utils.

---

## Contributing

* **Issues & discussions:** open a GitHub issue for bugs, proposals, or data-source ideas.
* **PRs:** prefer small, scoped PRs with checklists for metrics impact and data contracts.
---

## Roadmap 

* Week 1–3: architecture decisions, data contracts, UX flows. 
* Week 4–8: API stabilization, localization, core UI. 
* Week 9–11: testing, deploy, demo. *See Gantt on page 7.* 

---

## Acknowledgements & sources

* **Primary project proposal** — problem, solution, metrics, timeline, and team plan.
* **PoC metrics notes** — additional KPI framing for routing, suggestion, and safety. 
* **Five PoC phases** — structured process from need validation to presentation. 
