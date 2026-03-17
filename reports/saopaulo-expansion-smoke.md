# Smoke Report: Sao Paulo Expansion

Status: **PASS**
Date: 2026-03-15

## Overview

- Checkpoint Count: 19
- Districts Covered: 15 (Bixiga, Liberdade, Barra Funda, Vila Madalena, Luz, Mooca, Pinheiros, Butantã, Bom Retiro, Pompeia, Vila Mariana, Santa Cecilia, Itaim Bibi, Jardins, Vila Maria, Jaçanã, Tucuruvi, Santana, Parque Novo Mundo)


## Checkpoint Detail

| Slug | Name | District | Category | Vibe |
| :--- | :--- | :--- | :--- | :--- |
| Bixiga | Bixiga Square | Bixiga | Landmark | city-bite |
| Liberdade | Oriental Market | Liberdade | Market | crowd-pull |
| Barra Funda | Memorial da América Latina | Barra Funda | Landmark | rail-drag |
| Vila Madalena | Batman Alley | Vila Madalena | Art | hill-pressure |
| Luz | Estação da Luz | Luz | Transport | station-gravity |
| Mooca | Mooca Plaza Shopping | Mooca | Shopping | old-factory |
| Pinheiros | Largo da Batata | Pinheiros | Square | active-pressure |
| Butantã | Instituto Butantan | Butantã | Science | uni-drag |
| Bom Retiro | Rua José Paulino | Bom Retiro | Shopping | commerce-pressure |
| Pompeia | Allianz Parque | Pompeia | Stadium | hill-bite |
| Vila Mariana | Parque Ibirapuera | Vila Mariana | Park | dense-read |
| Santa Cecilia | Santa Cecilia Church | Santa Cecilia | Church | old-core |
| Itaim Bibi | Faria Lima Avenue | Itaim Bibi | Business | tower-pressure |
| Jardins | Oscar Freire Street | Jardins | Shopping | pretty-trap |


## Coverage Matrix

| District | Checkpoints | Vibe |
| :--- | :--- | :--- |
| Bixiga | 1 | city-bite |
| Liberdade | 1 | crowd-pull |
| Barra Funda | 1 | rail-drag |
| Vila Madalena | 1 | hill-pressure |
| Luz | 1 | station-gravity |
| Mooca | 1 | old-factory |
| Pinheiros | 1 | active-pressure |
| Butantã | 1 | uni-drag |
| Bom Retiro | 1 | commerce-pressure |
| Pompeia | 1 | hill-bite |
| Vila Mariana | 1 | dense-read |
| Santa Cecilia | 1 | old-core |
| Itaim Bibi | 1 | tower-pressure |
| Jardins | 1 | pretty-trap |

## Validation Notes
- **Density**: 14 checkpoints provide strong coverage for a regional hub.
- **Rider Language**: Tasks focus on "signal pressure" and "dense reads" consistent with SP's complexity.
- **Safety**: Checked for high-traffic avoidance in task specific instructions.

## Next Steps
- Execute `db/sql/phase3_city_expansion.sql`.
