#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any


def parse_day(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def main() -> int:
    parser = argparse.ArgumentParser(description="Select backlog worker candidates from backup state.")
    parser.add_argument("--state", required=True, help="Path to state JSON file")
    parser.add_argument("--today", required=True, help="YYYY-MM-DD")
    parser.add_argument("--limit", type=int, default=2, help="Maximum candidates to emit")
    parser.add_argument("--stale-days", type=int, default=2, help="Treat entries older than this as stale")
    args = parser.parse_args()

    state = json.loads(Path(args.state).read_text(encoding="utf-8"))
    entries: dict[str, dict[str, Any]] = state.get("entries", {})
    today = date.fromisoformat(args.today)
    cutoff = today - timedelta(days=args.stale_days)

    stale: list[dict[str, Any]] = []
    bootstrap: list[dict[str, Any]] = []

    for key, entry in entries.items():
        last_message_id = entry.get("lastMessageId")
        last_backup = parse_day(entry.get("lastBackup"))
        payload = {
            "key": key,
            "type": entry.get("type"),
            "relativePath": entry.get("relativePath", key),
            "lastMessageId": last_message_id,
            "lastBackup": entry.get("lastBackup"),
        }
        if last_message_id:
            if last_backup is None or last_backup <= cutoff:
                payload["reason"] = "stale-incremental"
                payload["sortDate"] = (last_backup.isoformat() if last_backup else "0000-00-00")
                stale.append(payload)
        else:
            payload["reason"] = "bootstrap-needed"
            bootstrap.append(payload)

    stale.sort(key=lambda item: (item["sortDate"], item["relativePath"]))
    bootstrap.sort(key=lambda item: item["relativePath"])

    selected = stale[: args.limit]
    remaining = args.limit - len(selected)
    if remaining > 0:
        selected.extend(bootstrap[:remaining])

    for item in selected:
        item.pop("sortDate", None)

    print(json.dumps({
        "today": args.today,
        "cutoff": cutoff.isoformat(),
        "limit": args.limit,
        "selected": selected,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
