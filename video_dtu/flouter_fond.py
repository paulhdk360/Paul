"""Floute l'arrière-plan d'un plan vertical 1080x1920 avec un masque net (outil + établi)
défini par polygones à clés temporelles, adouci par un flou gaussien.
Usage : flouter_fond.py in.mp4 out.mp4 clip1|clip2"""
import sys, subprocess, numpy as np, cv2
W, H = 1080, 1920
P = lambda *a: np.array(a, np.float32)
# --- masque net : (temps, polygone) ; interpolation linéaire entre clés
CLIPS = {
 "clip1": dict(keys=[(0, P((0,680),(150,660),(500,700),(960,800),(1080,840),(1080,H),(0,H)))],
               arm=(P((330,720),(520,560),(1080,120),(1080,720),(760,800)), (3.0,3.6,6.8,7.5))),
 "clip2": dict(keys=[
   (1,  P((0,1030),(270,850),(540,710),(900,610),(1080,700),(1080,H),(0,H))),
   (5,  P((0,1120),(270,930),(600,750),(850,670),(1080,760),(1080,H),(0,H))),
   (8,  P((0,1150),(270,960),(540,780),(810,645),(1080,700),(1080,H),(0,H))),
   (10, P((0,880),(300,780),(540,680),(860,610),(1080,680),(1080,H),(0,H))),
   (12, P((0,850),(324,680),(700,580),(1080,640),(1080,H),(0,H),(0,H)))],
   arm=(P((0,300),(700,300),(700,1250),(0,1250)), (10.8,11.3,99,99))),
}
def interp(keys, t):
    if t <= keys[0][0]: return keys[0][1]
    for (t0,a),(t1,b) in zip(keys, keys[1:]):
        if t <= t1: return a + (b-a)*(t-t0)/(t1-t0)
    return keys[-1][1]
def ramp(t, a):
    i0,i1,o0,o1 = a
    if t < i0: return 0.
    if t < i1: return (t-i0)/(i1-i0)
    if t < o0: return 1.
    if t < o1: return 1-(t-o0)/(o1-o0)
    return 0. if o0 < 90 else 1.
def main(src, dst, name):
    c = CLIPS[name]
    rd = subprocess.Popen(["ffmpeg","-v","error","-i",src,"-an","-f","rawvideo","-pix_fmt","bgr24","-"], stdout=subprocess.PIPE)
    wr = subprocess.Popen(["ffmpeg","-v","error","-y","-f","rawvideo","-pix_fmt","bgr24","-s",f"{W}x{H}","-r","30","-i","-",
        "-c:v","libx264","-crf","14","-preset","medium","-pix_fmt","yuv420p",dst], stdin=subprocess.PIPE)
    n = 0; S = 4
    while True:
        buf = rd.stdout.read(W*H*3)
        if len(buf) < W*H*3: break
        f = np.frombuffer(buf, np.uint8).reshape(H, W, 3); t = n/30; n += 1
        m = np.zeros((H//S, W//S), np.uint8)
        cv2.fillPoly(m, [(interp(c["keys"], t)/S).astype(np.int32)], 255)
        w = ramp(t, c["arm"][1])
        if w > 0:
            m2 = np.zeros_like(m); cv2.fillPoly(m2, [(c["arm"][0]/S).astype(np.int32)], 255)
            m = np.maximum(m, (m2*w).astype(np.uint8))
        m = cv2.GaussianBlur(m, (0,0), 14/ S*S/ S*1.0 + 5)
        m = cv2.resize(m, (W,H), interpolation=cv2.INTER_CUBIC).astype(np.float32)[...,None]/255
        small = cv2.resize(f, (W//2, H//2), interpolation=cv2.INTER_AREA)
        bl = cv2.GaussianBlur(small, (0,0), 13)
        bl = cv2.resize(bl, (W,H), interpolation=cv2.INTER_CUBIC).astype(np.float32)*0.88
        out = (m*f + (1-m)*bl).clip(0,255).astype(np.uint8)
        wr.stdin.write(out.tobytes())
    wr.stdin.close(); wr.wait()
if __name__ == "__main__": main(*sys.argv[1:4])
