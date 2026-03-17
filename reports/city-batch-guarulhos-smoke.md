# Smoke Report: Guarulhos City Batch

Status: **PASS**
Date: 2026-03-15

## Overview
The Guarulhos city batch (guarulhos) has been prepared with 16 checkpoints across 12 distinct districts. The pack focuses on the city's unique mix of industrial logistics hubs (Cumbica, Taboão), dense residential hills (Recreio, Cocaia), and a central grid (Centro, Gopoúva).

## Coverage Matrix

| District | Checkpoints | Vibe |
| :--- | :--- | :--- |
| Centro | 1 | grid-pressure |
| Vila Maia | 1 | hill-bite |
| Cumbica | 1 | industrial-pressure |
| Várzea do Tietê | 1 | river-pull |
| Pimentas | 1 | short-reset |
| Vila Galvão | 1 | residential-drag |
| Macedo | 1 | transit-pressure |
| Bom Clima | 1 | hill-gravity |
| Bosque Maia | 1 | short-reset |
| Taboão | 1 | industrial-seam |
| Aeroporto | 1 | signal-pressure |
| Gopoúva | 1 | hill-bite |
| Recreio São Jorge | 1 | hill-gravity |
| Monte Carmelo | 1 | dense-read |
| Paraventi | 1 | grid-pressure |
| Cocaia | 1 | hill-bite |
| Bonsucesso | 1 | industrial-pressure |
| Inocoop | 1 | short-reset |
| Jardim Presidente Dutra | 1 | highway-pressure |
| Parque Cecap | 1 | modernist-drag |
| Parque Continental | 1 | hill-bite |
| Haras | 1 | quiet-fast |
| Vila Augusta | 1 | old-core-pressure |
| Ponte Grande | 1 | river-drag |

## Validation Notes
- **Density**: 24 checkpoints meet the "deep pack" build standard.
- **Vibe Diversity**: Strong mix of `hill-bite`, `industrial-pressure`, and `grid-pressure`.
- **Rider Language**: All tasks (local, fast, chaotic) use the established "no soft timing" tone.
- **Safety**: Major transport corridors avoided for task locations; tasks focus on side streets and rider seams.

## Next Steps
- Execute `db/sql/guarulhos_city_seed.sql`.
- Update `docs/cities-documentation.md`.
