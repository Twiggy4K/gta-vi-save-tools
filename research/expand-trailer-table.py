"""Read the fingerprinted image and expand one lookup table to an in-memory pipe."""
import hashlib, lzma, sys
from pathlib import Path
image = Path(__file__).with_name('private-inputs') / 'game_scarlett_master.exe'
data = image.read_bytes()
if hashlib.sha256(data).hexdigest() != 'e95020b2fa4a721db3df59fdecf75621730ac559d8835252f6c3b658d5a08993':
    raise RuntimeError('Image fingerprint mismatch')
offset = int(sys.argv[1])
size = 0x4f4c5
blob = data[offset:offset+size]
if len(blob) != size:
    raise RuntimeError('Truncated packed table')
expected = 0x90000
decoder = lzma.LZMADecompressor(format=lzma.FORMAT_ALONE)
expanded = decoder.decompress(blob[:5] + expected.to_bytes(8, 'little') + blob[5:], max_length=expected+1)
if len(expanded) != expected:
    raise RuntimeError('Unexpected expanded table size')
# This stdout is captured as bytes by our Node module; never displayed or saved.
sys.stdout.buffer.write(expanded)
