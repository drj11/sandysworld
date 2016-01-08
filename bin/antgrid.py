#!/usr/bin/env python3


"""
After http://www.thingiverse.com/thing:747098/#files

This is a Python program to extract the map
from an Ant Attack snapshot and convert
to rid format.
"""

import datetime
import sys

def main(argv=None):
    if argv is None:
        argv = sys.argv

    fn = argv[1]

    print("https://github.com/drj11/sandysworld")
    print("Source: " + fn)
    print("Time: " + datetime.datetime.now().isoformat())
    print("~")

    for b in [1, 2, 4, 8, 16, 32]:
        with open(fn, 'rb') as f:
            f.read(32795)
            for y in range(128):
                s = ""
                bin = f.read(128)
                for c in bin:
                    if c & b:
                        s += "#"
                    else:
                        s += " "
                print(s)
            print("~")


if __name__ == '__main__':
    main()
