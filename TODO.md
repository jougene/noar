MVP:
- tests
- factory
- fixtures
- migrations
- seeds
- improve examples
- replace hardcoded columns with customizable version (keep defaults also)
- add possible to join one table two times (see example in mockinterview)
- fix update only one column - generate correct SQL for this

V2:
- add postgrespro demo database to examples
- add nested relations in WITH method ??? Maybe not
- add hasManyThrough hasOneThrough and belongsToThrough relations ====> to next version

Bugs:
- fix limits with joins (await User.with('transactions').limit(3) - when user has more than 3 transactions, they truncated)
- fix first combined with other queries
