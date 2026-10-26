# L04: Stop the Cache Stampede

Lesson: Caching > Invalidation and Stampedes. Full steps, hints, and progress are on the lab page of the site.

```bash
cd labs/L04-cache-stampede
./lab up        # start Postgres, Redis, app
./lab break     # flash sale load (leave running)
./lab watch     # second terminal: live numbers
# edit app/cache.py, then:
./lab restart
./lab check     # clean 40 s run, prints a code on pass
./lab hint      # next hint
./lab down      # stop and delete everything
```

Do not open `solution/` until you pass. `./lab solution` runs it if you want to compare.
