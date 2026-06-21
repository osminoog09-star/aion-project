# ADR 0001: Maps and Fuel intelligence use real Driver data only

- Status: Accepted
- Date: 2026-06-21
- Scope: AION Driver Maps/Fuel contracts, not a production engine

## Decision

Maps and Fuel intelligence may read only persisted Driver facts:

- GPS points and route summaries linked to a real `shiftId`;
- confirmed OCR or manual fuel entries linked by their real IDs;
- persisted shift income and operational-cost snapshots.

The canonical contracts live in
`aion-driver/features/intelligence/contracts/mapsFuelIntelligence.ts`.

Unknown values remain `null`. Kilometer segments start as `unclassified` and
fuel costs start as `unallocated`. A snapshot is not publishable until its
producer can prove sufficient source data and set `publishable: true`.

## Required provenance

Every snapshot carries the source shift, GPS point count, fuel entry IDs, and
generation time. Consumers must be able to trace a displayed metric back to
those persisted records.

## Explicitly excluded

- no inferred routes when GPS points are absent;
- no synthetic heatmaps, demand zones, fuel prices, or savings;
- no allocation of fuel to order/pickup/empty/personal kilometers without a
  real classification event;
- no tile, routing, map-matching, prediction, or recommendation engine in this
  slice;
- no UI placeholder rendered as a numeric metric.

## Next implementation gate

Implement producers only when ordinary Driver usage has accumulated the
required records. Until then, consumers hide the metric or show a non-numeric
empty state. Automated validation remains mandatory; owner device smoke is not
a dependency.
