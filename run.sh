#!/bin/bash

FRAMES_DIR="frames"

# Frame delay (seconds per frame)
FRAME_DELAY=0.041

# ANSI escape sequence to move cursor to top-left
RESET_CURSOR="\033[H"

# Frame playback loop
while true; do
    for frame in "$FRAMES_DIR"/*.txt; do
        echo -ne "$RESET_CURSOR"
        cat "$frame"
        sleep "$FRAME_DELAY"
    done
done

