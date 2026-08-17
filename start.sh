#!/bin/bash
cd "$(dirname "$0")"
echo "Task list running at http://127.0.0.1:5502"
python3 -m http.server 5502
