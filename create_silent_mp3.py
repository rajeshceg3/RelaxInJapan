# Hex for a minimal silent MP3 (MPEG 1 Layer III, 32kbps, 44.1kHz, mono)
# This is a very short silent clip.
hex_data = "FFFB90C400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"

import binascii

with open("audio/fesliyan-track-1.mp3", "wb") as f:
    f.write(binascii.unhexlify(hex_data * 50)) # Write 50 frames to make it last a bit
