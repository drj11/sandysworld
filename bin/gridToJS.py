#!/usr/bin/env python3

import itertools
import json
import os
import sys

def main(argv=None):
    if argv is None:
        argv = sys.argv

    fn = argv[1]
    base = fn[:fn.index('.')]

    with open(fn) as rows:
        for row in rows:
            if row.startswith("~"):
                break
        planes = []
        for filler, plane in itertools.groupby(
            rows, lambda row: row.startswith("~")):
            if filler:
                continue
            # In the game, +ve Y is in, so we have to
            # reverse the rows of the grid representation.
            planes.append(list(row.strip('\n') for row in plane)[::-1])
    with open(base + '.js', 'w') as out:
        out.write(base + "=")
        json.dump(planes, out)

if __name__ == '__main__':
    main()
