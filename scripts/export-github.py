#!/usr/bin/env python3
"""Export sanitized Git history to a separate checkout; never push the local repo.

Usage: python3 scripts/export-github.py /absolute/path/to/year1-public
Only main and v1.0.0 are exported. Private source history stays in the original.
The same command can refresh that public checkout for later fast-forward pushes.
"""
from pathlib import Path
import argparse
import json
import re
import subprocess
import tempfile


def git(cwd, *args, **kwargs):
    return subprocess.run(['git', '-C', str(cwd), *args], check=True, **kwargs)


def output(cwd, *args):
    return git(cwd, *args, stdout=subprocess.PIPE).stdout.decode().strip()


def export(destination):
    source = Path(__file__).resolve().parent.parent
    destination = destination.resolve()
    if destination == source or source in destination.parents:
        raise SystemExit('Use a separate checkout outside the private source repository.')
    if destination.exists() and any(destination.iterdir()) and not (destination / '.git/year1-export.json').exists():
        raise SystemExit('Destination must be empty or a previous Year1 export.')
    destination.mkdir(parents=True, exist_ok=True)
    if not (destination / '.git').exists():
        git(destination, 'init', '-b', 'main', stdout=subprocess.DEVNULL)
    if output(destination, 'status', '--porcelain'):
        raise SystemExit('Destination has uncommitted changes; preserve them before exporting.')
    if output(source, 'status', '--porcelain'):
        raise SystemExit('Commit the private source before exporting.')
    branch = output(source, 'symbolic-ref', 'HEAD')
    # Path filtering happens before any blob enters the export stream, including tags.
    with tempfile.TemporaryDirectory(prefix='year1-export-') as temporary:
        temporary = Path(temporary)
        stream = temporary / 'history.fi'
        before, after = temporary / 'before.marks', temporary / 'after.marks'
        with stream.open('wb') as handle:
            git(source, 'fast-export', '--signed-tags=strip', '--tag-of-filtered-object=rewrite',
                '--full-tree', '--export-marks=' + str(before),
                '--refspec=' + branch + ':refs/heads/main', branch, 'refs/tags/v1.0.0', '--', '.',
                ':(exclude)assets', ':(exclude)output', ':(exclude).openai', stdout=handle)
        with stream.open('rb') as handle:
            git(destination, 'fast-import', '--quiet', '--export-marks=' + str(after), stdin=handle)
        def marks(path):
            return dict(line.split() for line in path.read_text().splitlines())
        old, new = marks(before), marks(after)
        commit_map = {old[key]: new[key] for key in old.keys() & new.keys()}
    git(destination, 'reset', '--hard', 'main', stdout=subprocess.DEVNULL)
    audit(destination)
    baseline = output(source, 'rev-parse', 'v1.0.0^{}')
    record = {'private_head': output(source, 'rev-parse', 'HEAD'),
              'public_head': output(destination, 'rev-parse', 'main'),
              'private_v1': baseline, 'public_v1': output(destination, 'rev-parse', 'v1.0.0^{}'),
              'commit_map': commit_map}
    (destination / '.git/year1-export.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps({key: value for key, value in record.items() if key != 'commit_map'}, indent=2))
    print('History audit passed; push only main and v1.0.0 from this checkout.')


def audit(destination):
    objects = output(destination, 'rev-list', '--objects', '--all').splitlines()
    forbidden = re.compile(r'^(assets|output|\.openai|node_modules|dist|dist-pages)(/|$)|(^|/)(\.env($|\.)|[^/]*\.blend\d*$|[^/]*\.(pem|key)$)', re.I)
    for line in objects:
        sha, _, path = line.partition(' ')
        if forbidden.search(path):
            raise SystemExit('Refusing export: private path in reachable history: ' + path)
        if output(destination, 'cat-file', '-t', sha) != 'blob':
            continue
        data = git(destination, 'cat-file', 'blob', sha, stdout=subprocess.PIPE).stdout
        credential = rb'gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
        if re.search(credential, data):
            raise SystemExit('Refusing export: possible credential in blob ' + sha + ' at ' + path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path)
    export(parser.parse_args().destination)
