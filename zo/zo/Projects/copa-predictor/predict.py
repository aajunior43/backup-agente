"""
Copa do Mundo 2026 — Preditor baseado em dados
==============================================

FÓRMULA: Team Power Index (TPI) + simulação Monte Carlo.

TPI é uma média ponderada de seis métricas normalizadas:

    TPI = 0.25·FIFA + 0.20·Forma + 0.15·Elenco + 0.15·Copa + 0.10·Saldo + 0.15·ELO

  - FIFA: pontos no ranking da FIFA
  - Forma: vitórias nos últimos 10 jogos
  - Elenco: valor de mercado do elenco (€M)
  - Copa: títulos×15 + vices×10 + semis×5 + quartas×2
  - Saldo: saldo de gols nos últimos 20 jogos
  - ELO: força relativa (proxy do FIFA)

Probabilidade de vitória em um jogo (estilo ELO):

    expected_A = 1 / (1 + 10^((TPI_B - TPI_A) * 10))
    p_draw      = max(0.10, 0.24 - |TPI_A - TPI_B|·0.4)  (fase de grupos)
    p_draw      = max(0.10, 0.18 - |TPI_A - TPI_B|·0.4)  (mata-mata)
    p_A         = (1 - p_draw) · expected_A
    p_B         = (1 - p_draw) · (1 - expected_A)

Em mata-mata, empate vai para pênaltis (50/50).
"""

import random
import math
from collections import defaultdict
from pathlib import Path

random.seed(42)  # reprodutibilidade

# ============================================================
# 1) DADOS DAS 48 SELEÇÕES
# ============================================================
# fifa: pontos no ranking FIFA (jun/2026, estimativa)
# form10: vitórias nos últimos 10 jogos
# valor: valor de mercado do elenco (€M)
# titles/semis/quarters: campanha histórica em Copas
# gd20: saldo de gols nos últimos 20 jogos
TEAMS = {
    # Tier 1 - favoritos ao título
    "Argentina":        {"fifa": 1873, "form10": 7, "valor": 950,  "titles": 3, "semis": 3, "quarters": 1, "gd20": 14},
    "Espanha":          {"fifa": 1877, "form10": 8, "valor": 920,  "titles": 1, "semis": 1, "quarters": 2, "gd20": 18},
    "França":           {"fifa": 1870, "form10": 7, "valor": 1280, "titles": 2, "semis": 3, "quarters": 1, "gd20": 16},
    "Inglaterra":       {"fifa": 1835, "form10": 7, "valor": 1400, "titles": 1, "semis": 1, "quarters": 3, "gd20": 14},
    "Brasil":           {"fifa": 1764, "form10": 6, "valor": 1100, "titles": 5, "semis": 2, "quarters": 2, "gd20": 12},
    "Portugal":         {"fifa": 1807, "form10": 7, "valor": 950,  "titles": 0, "semis": 1, "quarters": 2, "gd20": 10},
    # Tier 2 - candidatos
    "Alemanha":         {"fifa": 1721, "form10": 6, "valor": 870,  "titles": 4, "semis": 4, "quarters": 2, "gd20":  8},
    "Países Baixos":    {"fifa": 1745, "form10": 6, "valor": 720,  "titles": 0, "semis": 2, "quarters": 2, "gd20":  7},
    "Bélgica":          {"fifa": 1700, "form10": 5, "valor": 580,  "titles": 0, "semis": 1, "quarters": 1, "gd20":  4},
    "Itália":           {"fifa": 1703, "form10": 6, "valor": 750,  "titles": 4, "semis": 3, "quarters": 2, "gd20":  6},
    "EUA":              {"fifa": 1700, "form10": 6, "valor": 350,  "titles": 0, "semis": 1, "quarters": 0, "gd20":  5},
    "México":           {"fifa": 1665, "form10": 5, "valor": 280,  "titles": 0, "semis": 0, "quarters": 2, "gd20":  3},
    "Uruguai":          {"fifa": 1670, "form10": 5, "valor": 350,  "titles": 2, "semis": 2, "quarters": 0, "gd20":  4},
    "Croácia":          {"fifa": 1710, "form10": 6, "valor": 350,  "titles": 0, "semis": 2, "quarters": 1, "gd20":  5},
    "Marrocos":         {"fifa": 1705, "form10": 7, "valor": 290,  "titles": 0, "semis": 1, "quarters": 0, "gd20":  6},
    "Suíça":            {"fifa": 1620, "form10": 5, "valor": 240,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  3},
    "Japão":            {"fifa": 1610, "form10": 6, "valor": 220,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  4},
    "Senegal":          {"fifa": 1620, "form10": 6, "valor": 220,  "titles": 0, "semis": 0, "quarters": 1, "gd20":  4},
    "Colômbia":         {"fifa": 1615, "form10": 5, "valor": 290,  "titles": 0, "semis": 0, "quarters": 1, "gd20":  3},
    "Coreia do Sul":    {"fifa": 1560, "form10": 5, "valor": 200,  "titles": 0, "semis": 1, "quarters": 0, "gd20":  2},
    "Noruega":          {"fifa": 1600, "form10": 6, "valor": 280,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  4},
    "Áustria":          {"fifa": 1610, "form10": 5, "valor": 220,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  3},
    "Suécia":           {"fifa": 1610, "form10": 5, "valor": 250,  "titles": 0, "semis": 1, "quarters": 0, "gd20":  3},
    # Tier 3
    "Irã":              {"fifa": 1530, "form10": 4, "valor":  90,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Arábia Saudita":   {"fifa": 1450, "form10": 4, "valor":  60,  "titles": 0, "semis": 0, "quarters": 0, "gd20": -1},
    "Austrália":        {"fifa": 1530, "form10": 4, "valor": 100,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Canadá":           {"fifa": 1530, "form10": 4, "valor": 110,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Egito":            {"fifa": 1500, "form10": 5, "valor": 130,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  1},
    "Iraque":           {"fifa": 1490, "form10": 4, "valor":  60,  "titles": 0, "semis": 0, "quarters": 0, "gd20": -1},
    "Argélia":          {"fifa": 1530, "form10": 5, "valor": 110,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  1},
    "Tunísia":          {"fifa": 1490, "form10": 4, "valor":  70,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Costa do Marfim":  {"fifa": 1500, "form10": 5, "valor": 130,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  1},
    "Gana":             {"fifa": 1450, "form10": 4, "valor":  80,  "titles": 0, "semis": 1, "quarters": 1, "gd20": -1},
    "Catar":            {"fifa": 1450, "form10": 3, "valor":  50,  "titles": 0, "semis": 0, "quarters": 0, "gd20": -2},
    "Bósnia":           {"fifa": 1450, "form10": 4, "valor":  80,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Cabo Verde":       {"fifa": 1420, "form10": 5, "valor":  30,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Curaçao":          {"fifa": 1390, "form10": 4, "valor":  15,  "titles": 0, "semis": 0, "quarters": 0, "gd20": -1},
    "Panamá":           {"fifa": 1450, "form10": 4, "valor":  30,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Haiti":            {"fifa": 1380, "form10": 4, "valor":  30,  "titles": 0, "semis": 0, "quarters": 0, "gd20": -1},
    "África do Sul":    {"fifa": 1480, "form10": 4, "valor":  60,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Tchéquia":         {"fifa": 1530, "form10": 4, "valor": 150,  "titles": 0, "semis": 1, "quarters": 0, "gd20":  0},
    "Turquia":          {"fifa": 1530, "form10": 4, "valor": 240,  "titles": 0, "semis": 1, "quarters": 0, "gd20":  0},
    "Equador":          {"fifa": 1530, "form10": 4, "valor": 130,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Uzbequistão":      {"fifa": 1490, "form10": 5, "valor":  50,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "RD Congo":         {"fifa": 1490, "form10": 5, "valor":  80,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
    "Paraguai":         {"fifa": 1490, "form10": 4, "valor": 100,  "titles": 0, "semis": 0, "quarters": 1, "gd20":  0},
    "Nova Zelândia":    {"fifa": 1320, "form10": 4, "valor":  25,  "titles": 0, "semis": 0, "quarters": 0, "gd20": -2},
    "Jordânia":         {"fifa": 1390, "form10": 4, "valor":  25,  "titles": 0, "semis": 0, "quarters": 0, "gd20": -1},
    "Escócia":          {"fifa": 1490, "form10": 5, "valor": 180,  "titles": 0, "semis": 0, "quarters": 0, "gd20":  0},
}

GROUPS = {
    "A": ["México", "África do Sul", "Coreia do Sul", "Tchéquia"],
    "B": ["Canadá", "Bósnia", "Catar", "Suíça"],
    "C": ["Brasil", "Marrocos", "Haiti", "Escócia"],
    "D": ["EUA", "Paraguai", "Austrália", "Turquia"],
    "E": ["Alemanha", "Curaçao", "Costa do Marfim", "Equador"],
    "F": ["Países Baixos", "Japão", "Suécia", "Tunísia"],
    "G": ["Bélgica", "Egito", "Irã", "Nova Zelândia"],
    "H": ["Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai"],
    "I": ["França", "Senegal", "Iraque", "Noruega"],
    "J": ["Argentina", "Argélia", "Áustria", "Jordânia"],
    "K": ["Portugal", "RD Congo", "Uzbequistão", "Colômbia"],
    "L": ["Inglaterra", "Croácia", "Gana", "Panamá"],
}

# ============================================================
# 2) CÁLCULO DO TPI
# ============================================================
def normalize(value, min_v, max_v):
    if max_v == min_v:
        return 0.5
    return (value - min_v) / (max_v - min_v)

def compute_tpi(team_data, all_teams):
    fifa_pts = [t["fifa"] for t in all_teams.values()]
    form_pts = [t["form10"] for t in all_teams.values()]
    valor_pts = [t["valor"] for t in all_teams.values()]
    wc_scores = [t["titles"] * 15 + t["semis"] * 5 + t["quarters"] * 2
                 for t in all_teams.values()]
    gd_pts = [t["gd20"] for t in all_teams.values()]

    n_fifa  = normalize(team_data["fifa"],    min(fifa_pts),  max(fifa_pts))
    n_form  = normalize(team_data["form10"],  min(form_pts),  max(form_pts))
    n_valor = normalize(team_data["valor"],   min(valor_pts), max(valor_pts))
    wc = team_data["titles"] * 15 + team_data["semis"] * 5 + team_data["quarters"] * 2
    n_wc    = normalize(wc,                    min(wc_scores), max(wc_scores))
    n_gd    = normalize(team_data["gd20"],   min(gd_pts),    max(gd_pts))
    n_elo   = n_fifa  # proxy: usa o ranking FIFA normalizado

    return (0.25 * n_fifa + 0.20 * n_form + 0.15 * n_valor
            + 0.15 * n_wc + 0.10 * n_gd + 0.15 * n_elo)

TPI = {name: round(compute_tpi(d, TEAMS), 4) for name, d in TEAMS.items()}

# ============================================================
# 3) PROBABILIDADE DE JOGO
# ============================================================
def match_probs(tpi_a, tpi_b, knockout=False):
    expected_a = 1 / (1 + 10 ** ((tpi_b - tpi_a) * 10))
    draw_base = 0.18 if knockout else 0.24
    p_draw = max(0.10, draw_base - abs(tpi_a - tpi_b) * 0.4)
    rest = 1 - p_draw
    return rest * expected_a, p_draw, rest * (1 - expected_a)

# ============================================================
# 4) SIMULAÇÃO DE JOGO
# ============================================================
def simulate_match(a, b, knockout=False, rng=None):
    """Retorna (winner, ga, gb). winner é o nome do time vencedor ou 'draw'."""
    rng = rng or random
    pa, pd, pb = match_probs(TPI[a], TPI[b], knockout)
    r = rng.random()
    if r < pa:
        winner = a
    elif r < pa + pd:
        winner = "draw"
    else:
        winner = b
    avg_a = 0.6 + TPI[a] * 2.2
    avg_b = 0.6 + TPI[b] * 2.2
    ga = max(0, int(rng.gauss(avg_a, 1.0)))
    gb = max(0, int(rng.gauss(avg_b, 1.0)))
    if winner == "draw":
        ga = gb = rng.randint(0, 2)
    elif winner == a and ga <= gb:
        ga = gb + rng.randint(1, 2)
    elif winner == b and gb <= ga:
        gb = ga + rng.randint(1, 2)
    return winner, ga, gb

def simulate_group_table(group_teams, rng):
    """Retorna (ordered, stats, matches) onde matches = [(a, b, ga, gb, winner), ...]"""
    table = {t: {"pts": 0, "gf": 0, "gs": 0, "wins": 0} for t in group_teams}
    matches = []
    pairs = [(group_teams[i], group_teams[j])
             for i in range(4) for j in range(i + 1, 4)]
    for a, b in pairs:
        winner, ga, gb = simulate_match(a, b, knockout=False, rng=rng)
        table[a]["gf"] += ga; table[a]["gs"] += gb
        table[b]["gf"] += gb; table[b]["gs"] += ga
        if ga > gb:
            table[a]["pts"] += 3; table[a]["wins"] += 1
        elif gb > ga:
            table[b]["pts"] += 3; table[b]["wins"] += 1
        else:
            table[a]["pts"] += 1; table[b]["pts"] += 1
        matches.append((a, b, ga, gb, winner))
    ordered = sorted(group_teams,
                     key=lambda t: (-table[t]["pts"],
                                    -(table[t]["gf"] - table[t]["gs"]),
                                    -table[t]["gf"],
                                    -table[t]["wins"]))
    return ordered, [table[t] for t in ordered], matches

# ============================================================
# 5) BRACKET DO MATA-MATA
# ============================================================
def build_bracket(qualified, rng):
    rng.shuffle(qualified)
    bracket = []
    used = set()
    pool = list(qualified)
    while len(pool) >= 2:
        a = pool.pop(0)
        for j, opp in enumerate(pool):
            if opp[0] != a[0]:
                bracket.append((a[2], opp[2]))
                pool.pop(j)
                break
        else:
            bracket.append((a[2], pool.pop(0)[2]))
    return bracket

def play_knockout_round(pairs, rng):
    """Retorna (winners, losers, scores) onde scores = [(ga, gb), ...]"""
    winners, losers, scores = [], [], []
    for a, b in pairs:
        winner, ga, gb = simulate_match(a, b, knockout=True, rng=rng)
        if winner == "draw":
            if rng.random() < 0.5:
                winner, ga = a, ga + 1
            else:
                winner, gb = b, gb + 1
        winners.append(winner)
        losers.append(b if winner == a else a)
        scores.append((ga, gb))
    return winners, losers, scores

def simulate_tournament(rng=None):
    rng = rng or random
    # Fase de grupos
    group_tables = {}
    group_matches = {}
    third_places = []
    for gname, teams in GROUPS.items():
        ordered, stats, matches = simulate_group_table(teams, rng)
        group_tables[gname] = list(zip(ordered, stats))
        group_matches[gname] = matches
        third = ordered[2]
        s = stats[2]
        third_places.append({
            "team": third, "pts": s["pts"],
            "gd": s["gf"] - s["gs"], "gf": s["gf"], "wins": s["wins"],
            "group": gname,
        })
    # 12 primeiros + 12 segundos + 8 melhores terceiros
    qualified = []
    for gname, lst in group_tables.items():
        qualified.append((gname, 1, lst[0][0]))
        qualified.append((gname, 2, lst[1][0]))
    third_places.sort(key=lambda x: (-x["pts"], -x["gd"], -x["gf"], -x["wins"]))
    for t in third_places[:8]:
        qualified.append((t["group"], 3, t["team"]))

    # Mata-mata: cada rodada retorna (winners, losers, scores)
    # r32 (16) -> r16 (8) -> qf (4) -> sf (2) -> final (1)
    r32_pairs = build_bracket(qualified, rng)
    r32_w, r32_l, r32_scores = play_knockout_round(r32_pairs, rng)
    r16_pairs = [(r32_w[i], r32_w[i + 1]) for i in range(0, 16, 2)]
    r16_w, r16_l, r16_scores = play_knockout_round(r16_pairs, rng)
    qf_pairs = [(r16_w[i], r16_w[i + 1]) for i in range(0, 8, 2)]
    qf_w, qf_l, qf_scores = play_knockout_round(qf_pairs, rng)
    sf_pairs = [(qf_w[i], qf_w[i + 1]) for i in range(0, 4, 2)]
    sf_w, sf_l, sf_scores = play_knockout_round(sf_pairs, rng)
    final_pairs = [(sf_w[0], sf_w[1])]
    final_w, final_l, final_scores = play_knockout_round(final_pairs, rng)

    return {
        "champion":    final_w[0],
        "runner_up":   final_l[0],
        "group_tables": group_tables,
        "group_matches": group_matches,
        "qualified": qualified,
        "rounds": {
            "R32":   {"pairs": r32_pairs,   "winners": r32_w, "losers": r32_l, "scores": r32_scores},
            "R16":   {"pairs": r16_pairs,   "winners": r16_w, "losers": r16_l, "scores": r16_scores},
            "QF":    {"pairs": qf_pairs,    "winners": qf_w,  "losers": qf_l,  "scores": qf_scores},
            "SF":    {"pairs": sf_pairs,    "winners": sf_w,  "losers": sf_l,  "scores": sf_scores},
            "Final": {"pairs": final_pairs, "winners": final_w, "losers": final_l, "scores": final_scores},
        },
    }

# ============================================================
# 6) MONTE CARLO
# ============================================================
N_SIMS = 10_000

def run_monte_carlo():
    champ_count = defaultdict(int)
    reach = {  # em qual rodada cada time caiu pela última vez
        "R32": defaultdict(int),
        "R16": defaultdict(int),
        "QF":  defaultdict(int),
        "SF":  defaultdict(int),
        "Final": defaultdict(int),
        "Campeão": defaultdict(int),
    }
    brazil_path = defaultdict(int)  # quantas vezes o Brasil caiu em cada fase

    for _ in range(N_SIMS):
        res = simulate_tournament()
        champ_count[res["champion"]] += 1
        # Conta quem chegou a cada fase
        all_teams = set(TEAMS.keys())
        eliminated = {
            "R32": set(res["rounds"]["R32"]["losers"]),
            "R16": set(res["rounds"]["R16"]["losers"]),
            "QF":  set(res["rounds"]["QF"]["losers"]),
            "SF":  set(res["rounds"]["SF"]["losers"]),
            "Final": {res["runner_up"]},
        }
        for t in all_teams:
            if t in eliminated["R32"]:
                reach["R32"][t] += 1
            elif t in eliminated["R16"]:
                reach["R16"][t] += 1
            elif t in eliminated["QF"]:
                reach["QF"][t] += 1
            elif t in eliminated["SF"]:
                reach["SF"][t] += 1
            elif t in eliminated["Final"]:
                reach["Final"][t] += 1
            elif t == res["champion"]:
                reach["Campeão"][t] += 1

        # Brasil em particular
        if "Brasil" in eliminated["R32"]:
            brazil_path["R32"] += 1
        elif "Brasil" in eliminated["R16"]:
            brazil_path["R16"] += 1
        elif "Brasil" in eliminated["QF"]:
            brazil_path["QF"] += 1
        elif "Brasil" in eliminated["SF"]:
            brazil_path["SF"] += 1
        elif "Brasil" in eliminated["Final"]:
            brazil_path["Final"] += 1
        elif "Brasil" == res["champion"]:
            brazil_path["Campeão"] += 1

    return champ_count, reach, brazil_path

# ============================================================
# 7) RELATÓRIO
# ============================================================
def pct(n, total=N_SIMS):
    return 100.0 * n / total

# ============================================================
# 8) CAMINHO COMPLETO DE UMA SIMULAÇÃO
# ============================================================
def print_full_tournament(result):
    """Imprime a Copa inteira: 12 grupos com tabela e placares, depois mata-mata."""

    def classify_marker(pos):
        if pos == 0: return "1º  → R32"
        if pos == 1: return "2º  → R32"
        if pos == 2: return "3º  ⇨ (melhores)"
        return "4º  ✗"

    print("\n" + "=" * 78)
    print("FASE DE GRUPOS")
    print("=" * 78)
    for gname in sorted(result["group_tables"].keys()):
        teams_stats = result["group_tables"][gname]
        matches = result["group_matches"][gname]
        print(f"\n  ┌── GRUPO {gname} ──┐")
        for i, (team, st) in enumerate(teams_stats):
            draws = st["pts"] - 3 * st["wins"]
            losses = 3 - st["wins"] - draws
            gd = st["gf"] - st["gs"]
            print(f"  │ {classify_marker(i):<14} {team:<18} "
                  f"P={st['pts']:>2}  V={st['wins']} E={draws} D={losses}  "
                  f"SG={gd:+d}  {st['gf']}x{st['gs']}")
        print(f"  │ Jogos:")
        for a, b, ga, gb, w in matches:
            tag = "✓" if w == a else ("✓" if w == b else "=")
            print(f"  │   {a:<15} {ga} x {gb} {b:<15}  {tag}")
        print(f"  └{'─'*40}")

    for round_name in ["R32", "R16", "QF", "SF", "Final"]:
        data = result["rounds"][round_name]
        print(f"\n{'=' * 78}")
        print(f"  {round_name}")
        print(f"{'=' * 78}")
        for (a, b), (ga, gb), w in zip(data["pairs"], data["scores"], data["winners"]):
            pen = " (pen.)" if ga == gb else ""
            print(f"  {a:<20} {ga:>2} x {gb:>2}  {b:<20}{pen}   →  {w}")

    print(f"\n{'=' * 78}")
    print(f"  🏆  CAMPEÃO: {result['champion']}")
    print(f"  🥈  Vice:    {result['runner_up']}")
    print(f"{'=' * 78}\n")

# ============================================================
# 9) MAIN
# ============================================================
def main():
    print("=" * 70)
    print("COPA DO MUNDO 2026 — SIMULAÇÃO MONTE CARLO")
    print(f"Base: TPI ponderado de 6 métricas | {N_SIMS:,} simulações")
    print("=" * 70)

    print("\n>>> Top 10 seleções por TPI (força relativa):")
    for i, (team, tpi) in enumerate(
            sorted(TPI.items(), key=lambda x: -x[1])[:10], 1):
        print(f"  {i:2d}. {team:<20} TPI = {tpi:.4f}")

    print(f"\n>>> Rodando {N_SIMS:,} simulações...")
    champ, reach, br_path = run_monte_carlo()

    print("\n>>> Probabilidade de ser CAMPEÃO (top 12):")
    for team, c in sorted(champ.items(), key=lambda x: -x[1])[:12]:
        if c == 0:
            continue
        print(f"  {team:<20} {pct(c):5.2f}%  ({c:,} títulos)")

    print("\n>>> Probabilidade de chegar a cada fase (top 16):")
    print(f"  {'Seleção':<18} {'R32':>6} {'R16':>6} {'QF':>6} {'SF':>6} {'Final':>7} {'CAMPEÃO':>8}")
    teams_by_tpi = sorted(TPI.keys(), key=lambda t: -TPI[t])[:18]
    for t in teams_by_tpi:
        r32 = pct(reach["R32"][t])
        r16 = pct(reach["R16"][t])
        qf  = pct(reach["QF"][t])
        sf  = pct(reach["SF"][t])
        fi  = pct(reach["Final"][t])
        ch  = pct(reach["Campeão"][t])
        if r32 + r16 + qf + sf + fi + ch < 0.1:
            continue
        print(f"  {t:<18} {r32:5.1f}% {r16:5.1f}% {qf:5.1f}% "
              f"{sf:5.1f}% {fi:6.1f}% {ch:7.2f}%")

    print("\n>>> Caminho provável do BRASIL:")
    total_br = sum(br_path.values())
    for fase in ["Campeão", "Final", "SF", "QF", "R16", "R32"]:
        c = br_path[fase]
        if c:
            print(f"  {fase:<10} {pct(c, total_br):5.2f}%")

    # Persiste o resultado em TXT
    out = Path(__file__).parent / "resultado.txt"
    with out.open("w", encoding="utf-8") as f:
        f.write("COPA DO MUNDO 2026 — SIMULAÇÃO\n")
        f.write(f"TPI (Team Power Index) | {N_SIMS:,} simulações\n")
        f.write("=" * 60 + "\n\n")
        f.write("CHANCES DE TÍTULO\n")
        for team, c in sorted(champ.items(), key=lambda x: -x[1]):
            if c == 0: continue
            f.write(f"  {team:<20} {pct(c):5.2f}%\n")
        f.write("\nCAMINHO DO BRASIL\n")
        total_br = sum(br_path.values())
        for fase in ["Campeão", "Final", "SF", "QF", "R16", "R32"]:
            c = br_path[fase]
            if c:
                f.write(f"  {fase:<10} {pct(c, total_br):5.2f}%\n")
    print(f"\n[resultado salvo em {out}]")

    # ---- CAMINHO COMPLETO DE UMA SIMULAÇÃO ----
    print("\n\n" + "█" * 78)
    print("█" + " CAMINHO COMPLETO DE UMA SIMULAÇÃO (com placares) ".center(76) + "█")
    print("█" * 78)
    sample_rng = random.Random(20260614)
    sample = simulate_tournament(rng=sample_rng)
    print_full_tournament(sample)

    out_full = Path(__file__).parent / "caminho_completo.txt"
    import io, contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        print_full_tournament(sample)
    out_full.write_text(
        "COPA DO MUNDO 2026 — CAMINHO COMPLETO (uma simulação, seed 20260614)\n"
        + buf.getvalue(),
        encoding="utf-8",
    )
    print(f"[caminho completo salvo em {out_full}]")

if __name__ == "__main__":
    main()
