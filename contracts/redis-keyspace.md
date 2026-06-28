# Redis Keyspace Contract

Redis is installation-scoped; therefore every key below belongs to exactly one subreddit installation even though the key name does not repeat the subreddit ID.

| Key                           | Type       | Purpose                                   | Retention                 |
| ----------------------------- | ---------- | ----------------------------------------- | ------------------------- |
| `dd:v1:tiles`                 | hash       | `tileId -> CourseTile JSON`               | Until removal/maintenance |
| `dd:v1:routes`                | hash       | `routeId -> RouteBundle JSON`             | Evergreen                 |
| `dd:v1:daily-routes`          | hash       | `YYYY-MM-DD -> routeId`                   | Evergreen index           |
| `dd:v1:route-index`           | sorted set | route IDs scored by publish timestamp     | Capped by maintenance     |
| `dd:v1:profiles`              | hash       | `userId -> PlayerProfile JSON`            | Account/app lifecycle     |
| `dd:v1:submissions:{date}`    | hash       | `userId -> tileId`                        | 35 days                   |
| `dd:v1:leaderboard:{routeId}` | sorted set | `userId -> best score`                    | Route lifecycle           |
| `dd:v1:best-runs:{routeId}`   | hash       | `userId -> RunResult JSON`                | Route lifecycle           |
| `dd:v1:run-token:{uuid}`      | string     | One-use run-start envelope                | 15 minutes                |
| `dd:v1:featured-counts`       | hash       | `tileId -> count`                         | Tile lifecycle            |
| `dd:v1:settings`              | hash       | Stable installation settings and post IDs | Installation lifecycle    |

## Invariants

1. Never rely on scanning every Redis key. Collection members live in known hashes or sorted sets.
2. Never mix standard and compressed Redis clients on one key.
3. Run tokens are one-use and deleted on completion.
4. Large route histories should be maintained in bounded scheduled batches.
5. World Tour data does not live in this keyspace. It requires a separate shared service and explicit publication contract.
