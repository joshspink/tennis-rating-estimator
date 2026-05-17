from dataclasses import dataclass
from datetime import datetime
from typing import Iterable


@dataclass(frozen=True)
class Match:
    date: str
    court: str
    partner: str
    partner_rating: float
    opponents: tuple[tuple[str, float], tuple[str, float]]
    result: str
    score: str
    tennis_record_match: float
    tennis_record_rating: float


MATCHES = [
    Match(
        date="02/19/2026",
        court="D2",
        partner="Rupen Shah",
        partner_rating=3.60,
        opponents=(("Bryan Bounds", 3.35), ("Don Baik", 3.82)),
        result="W",
        score="3-6 6-3 1-0",
        tennis_record_match=3.69,
        tennis_record_rating=3.73,
    ),
    Match(
        date="03/07/2026",
        court="D2",
        partner="Sebastian Mendez",
        partner_rating=3.69,
        opponents=(("juan Torres", 3.78), ("Boris Kuchuk", 3.73)),
        result="L",
        score="2-6 6-3 1-0",
        tennis_record_match=3.77,
        tennis_record_rating=3.74,
    ),
    Match(
        date="03/13/2026",
        court="D3",
        partner="Daniel Dolsberry",
        partner_rating=3.73,
        opponents=(("Don Baik", 3.85), ("Boris Kuchuk", 3.73)),
        result="L",
        score="7-6 6-1",
        tennis_record_match=3.62,
        tennis_record_rating=3.71,
    ),
    Match(
        date="04/19/2026",
        court="D3",
        partner="Don Monk",
        partner_rating=3.28,
        opponents=(("Boris Kuchuk", 3.66), ("Camilo Fita", 3.54)),
        result="W",
        score="7-6 6-3",
        tennis_record_match=3.90,
        tennis_record_rating=3.79,
    ),
    Match(
        date="05/03/2026",
        court="D1",
        partner="Thomas Duffaut",
        partner_rating=3.64,
        opponents=(("Enzo Vettorato", 3.88), ("Paul Wesson", 3.53)),
        result="L",
        score="6-1 6-3",
        tennis_record_match=3.49,
        tennis_record_rating=3.69,
    ),
]


def parse_score(match: Match) -> tuple[int, int]:
    """Return Josh's team's games and opponents' games from TennisRecord score text."""
    winner = 0
    loser = 0
    for set_score in match.score.split():
        left, right = (int(part) for part in set_score.split("-"))
        winner += left
        loser += right
    if match.result == "W":
        return winner, loser
    return loser, winner


def game_margin_adjustment(mine: int, theirs: int, scale: float) -> float:
    total = mine + theirs
    if total == 0:
        return 0.0
    return scale * (mine - theirs) / total


def expected_individual_rating(match: Match, score_scale: float = 0.26) -> float:
    opponent_avg = sum(rating for _, rating in match.opponents) / 2
    mine, theirs = parse_score(match)
    team_performance = opponent_avg + game_margin_adjustment(mine, theirs, score_scale)
    return round((2 * team_performance) - match.partner_rating, 2)


def dynamic_ratings(
    matches: Iterable[Match],
    starting_rating: float = 3.76,
    blend: float = 0.32,
    score_scale: float = 0.26,
    use_published_match_rating: bool = False,
) -> list[dict[str, float | str]]:
    rating = starting_rating
    rows = []
    for match in sorted(matches, key=lambda m: datetime.strptime(m.date, "%m/%d/%Y")):
        mock_match = expected_individual_rating(match, score_scale=score_scale)
        match_rating = match.tennis_record_match if use_published_match_rating else mock_match
        rating = round((rating * (1 - blend)) + (match_rating * blend), 4)
        rows.append(
            {
                "date": match.date,
                "score": match.score,
                "result": match.result,
                "mock_match": mock_match,
                "tr_match": match.tennis_record_match,
                "mock_rating": rating,
                "tr_rating": match.tennis_record_rating,
            }
        )
    return rows


def print_table(rows: Iterable[dict[str, float | str]]) -> None:
    headers = ["date", "result", "score", "mock_match", "tr_match", "mock_rating", "tr_rating"]
    print(" | ".join(headers))
    print(" | ".join("-" * len(header) for header in headers))
    for row in rows:
        print(" | ".join(str(row[header]) for header in headers))


if __name__ == "__main__":
    print_table(dynamic_ratings(MATCHES))
