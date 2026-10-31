"use client"

import { useEffect, useId, useRef, useState } from "react"

export type Mood = "idle" | "happy" | "cheering" | "oops" | "sad" | "thinking" | "explaining" | "listening" | "sleep"

/* ------------------------------------------------------------------------------------------------
   Jelly is the real artwork (/jelly/idle.webp), rigged in layers so it moves like a character:
   - the face (eyes, brows, mouth) is blanked with a tiny smooth patch and redrawn live: blinks, looks around,
     changes expression and lip-syncs when speaking
   - the raised arm is a clipped copy of the same picture that swings (wave)
   - the whole body floats, breathes and bounces
   Everything is positioned in the picture's own 626 x 840 coordinate space.
------------------------------------------------------------------------------------------------- */

const W = 626, H = 840
const px = (x: number) => (x / W) * 100 + "%"
const py = (y: number) => (y / H) * 100 + "%"

const IMG = "/jelly/idle.webp"
const FACE_PATCH = "data:image/webp;base64,UklGRpgMAABXRUJQVlA4WAoAAAAQAAAAXgAARQAAQUxQSKwGAAABZ8cgkqQ49OBfNeSPgIjI4SdZ2XMVosjdsuc8hyBbDtNxeifBsG0jIU1b/T9w7D8wDBHR/wnQv1lrSVNJC2YlWNIVehxeSQ71Cj0zNtgGB0pyPgYzaYk6CdDySvzC8v7/hyNbn8+vkIqTTnfSabv72LaNi5255D9g7+7q3p1t2zi2re6ethlU/b6LpCu/qjncRcQE4Limm+vKe8He1l6tGWjBq25i6OqPDKWD9flXZhcUXn3tytUffT8AyObCS+V8yrZa+KpBd+zGKRGABDA6Otpfynk2oV8tkBiZEBAAREgr1z82OtxXVLVa8Crh5NJs11ZApzgylN86tuW/OogWhCEJgEjWH3h8R14VGmtbIuqoVpIivOfXr/ivBkyc8q4zqQmGAECR8b11La8CUKVTz+l1ARGCR4HwWNN4VbSzRee0wbIHQAC2gzTh8NUBCvt9/UOT49WSDUBAQMRacDxESQWIxATSdNx0sXdgdGKkWkAr1cpTw1YEdD0vyfqBy3gAIC3Hy1cGx2bGqllLH84+NJSGcdqZynA1y4NjA25sAOVmSgMD/X2V7kywNr/ZU7CMMTk8NlOobelccsbxY2NnBk4588S+gqcojQ3Wmo2GL2YsNz902+kEhHjHuXnGgyo1cNbl5w7iyP7TzhkvOMqEslLlkb4KBIRI7+lFFQ8kylODhABsEUFhciRvG6CTHxgtQiu0aunNxoNN5mwIiSMJQbHokh1QeaXhQRck2tFSiKW1cQCNDilwGNgMRSfbO1aB4GjB+r7Ewp3XZCcAEWwlREKoRNfgUBrgUcKDJzZ1DHSQ2KbA6HpacCRVqjLRB0FIofzv/u04NOppGM8FQTuB2z1cABhCWP/Xj584kOiC3b0cxYywFNR0G6vrog9cYCH8wh//EtiIoVU+vQDj+YsGnRY6IzeeoiWUfvA3/5+1EEO6A9MQU4KTZtIKABKjJwkZpnHHHx5d3FNxgDdYNQeUTyq0cbsLREjh9n0vr26u+LWar6NispqNQKvJHquFighJABI09ze6sb2570tEXpctME70lh0CaO7sS4iQIydX9hfXa0E0dgqRlsouANRffp4QCSUAkBg90z22uB8JqKJJZW0A0njxj8+Q6Jgi2bNL8wtOJFFbniIAuKUS6psdASSUHbg8fkCilZbsNe6AdARAsJuJRiIKyfRFL9AIeJiFjiBoxsWd+qTAdAm+OWnsCCMRacfcNV+lmBGU7Jovxg5X6pAIgppuZ/V95LOmAJXcOwxDpRQIEW2RUl/cQJSHe760cU/99LthWpjb3fLb0XK8dCbpErqx31dIWI35uUg21xpoZfrKL52nTQFWY/lQWmyvUB0oZxMEEDQ+dNNpFWfpcU1jgsXlprTAKZdAcxjudwnQzk1cevvbblBo7y8/fccD6+d/XIkhhQtu7bfRLp9GlD19CUBZ+bFzTu9REGlDAlt3/2XnnYNCM6KuPT/LNrSSTiTpalKplNs9mIQW4mgB8fifnNNhljJ09YiL9lSIkKIKnkqMqBQ0ifACvvTvkytCE8A5Z+TVEZF7ttVzWRMgOtfqhdSgEhNSPq3PRVxJb/pGGBYuHjiAdGYNVpMqhEQElT/tVIqxu1Z8qM5SGU/haN3UEVnl05MwHvzxvs2NANQEW0RAXVcWETIxcaYdUc8gxJRY/Xv/+MaPZgFAAJDA8v82+hyEpN17ciKSOnI50JRG0Vm585tf+9FJAzkbgD5YfPqlVJeNUMxN58UcZbvhODCu4drB9rN//PrQcLUrxfr2tu9Vkgrhaff1KWOCg8WaMAoCurbxvOslPRtBvZB1FTpP90NMASsLh00/imYggG4SJCFQhEHNLkT44uzh/j7ElGDnQBC5NFmDmBEePrBQW1uCeTm2o+Nw+DBhCM88st1YeTqgmBFsPLMdA1iFmSlT858ac1Th7XdYQhOU0pVTCcaAbu9JBTFA8X51dZZwpj41ACPA5AkFhTgyWSkrA0DlfX0WwMyFZQdiItVTtBFP5boUSjgB3Ox4AgBU0WUDlFCiFZq2azMmIJrbB1ACsEUECnXYSbbAQmNtGaQI2wgU9MqWTyK20tx84ZXAAiAASewtbPsg2ou/8eyjL/ugtCFqzz48ux8IYiy1pcfuOG246ALA4fz998wdBAgp9fUn/v6Hf1VyCSX6cOcff/jPM1s+4q3ra48NDPeV01Zz53s/v+P53UDCQPydl+/6dSAANeUPDy7sBRIziL/neF7SoW5s7mmL6JiWa1kKEB0EWguOQwFJAqIJ00Sr4K1QVlA4IMYFAACQGwCdASpfAEYAPj0YiUMiIaEZmc5UIAPEsQbYArAbvyr/Icq72nIsepjfbdTzAfsZ+wHvP/3T9Vfdr6AHSEftv7AH6c+mr7E/7p+kpeGn5GR9HnqtZkLsnyN//jeyT/T+M38u/zfsB/yj+df8HsL/sd7DH6wq/ACyY5CluZDCDoqaV4CJdyN7k6o9wOm7e1E+t6RrpJl+ZVJCYB+Y7gZN98iKy+rFwz95DcDO/1/BIWv1Mf7iASwVekORxrWbkfLVYJomtne/pL1/4avPP5MCXE55XPsfSHFDbMJPsuWX0Foc6KngAP7//k4XP//6LujCW6uPYvtXeFKT1pz6Mk76+nDdyRfFH2G98WzroM3gFRpIcnPIncp+6T7Bf+zEs01hr6En41LkkUeAgEJDkN/80WtldT+xSHSLY8q0ggdVE/W35HkQ9VaTud2boHu5cK647nDbaX5FVu0j0bn7/x9FEc5/OirbOV6pm+f/yKatNCX8dwXW4PrsymiCMRPg2iXeBKzxiHA4MJ2VcONuW5uzUMvkd3iBZKjkx3T359NFJly8qn5yFkelEvngqqzoSsSvApQd+2//zbjegeLeGPC1wqCjvB/nfCmw2ajNWhW65R7xWarn4uJWUaykt65JbdffjdT81NKaz0/k4MGWKeyx6UTXjcxx9ZhS8L086Ffh/NIet/vUiStY/ANgwZWye8ymjP1CNJWF7DuvPII6z4V3N9cbWEBH4Na79YHn/y03rfRDvCd8G63Ua1uK9GNH0bY2nkdczo+gwKAl6RSeGUzfgKTSI3h5/hVjX3o/QLs4qwEsiv/+zU2zo79Hz2A1HWlZwv/Gr0tlaT5OnbH93dFMEgFNVPv5+VkQ+VXPKWQ0CBtpVhsb2zhbKFaP6tqA4ZPDX4gOK/AfzhYYJg64S4en4mt9U92A9+iF7ZAdC7xzhCXt/2Tb1b3jJmyLvk1fE5BP/pnU+Fta6bMeT779n7lCWPquYKA44dHFQr83mUwwGuSWOZy9cHyWim3b02RjHZbvaxX6/xmmDCzF9o+2NDejqX+dwT2IJepErw02oKsi/y9DjtXA2jRF5VG1gvfD2M/xw+7yxXmCDXXb/uLtjfDPO4MPgVyeq/I6DiU2GL49+Amr36mZMixswNDLPeVHnm+tm++TWapQPI8lMsLI+11OrQVdz0YUNQG1234We/NfZQAPKTXVTq0NEHAQZgz4pi8In4dc2FP5yMBSrlOvpXVFnXT2/kf3oNWXcDSj0lB/dNDMtFExePCAGfpmYXnooi47IMYWK42LKMhSlNN9RCjHQE+LoGaQrepBk8J7AqRnKonofj9iTJJIv45F5gCJh695nB4xDquJ3RiMHB4uv8i8ZWMaqJgpnCg2gsfNm7b4uR12xoZbdJtHWzSB3nWsbkCesunK8RxdyGSQS0iD4A361a4MUufg3McSwVS5MSydSJDVEc1H6ye5+laWivWVagXzz9Rvyspia1ThZzVKKUzc/GeOLrXMX2/AIQucXfszvvJiIXUzZoetv1mbsaGk40J+qOdLiYPc7LF1MYum9S8si10X8fBpOOeJdTdxIL1ZqC/v/ugykxmGtb0jDd/1F3QXfdNicT9AcyzqAyg55sf8EGxBH8xeuKT/+AroPW4I/3DHd8JWwiE8kC5MZX6L0bMjvF8Nw//0u2fmMUWlJxPMf2/oHUE86/UBb5xLtyotXlfC4JEYFmtEDDc/KB+S81BSWSgO7qi/9yMbvMQv1FEJFlW2OM9J7TYxNCFtord4fiAGph8UOfqP///0m/JI4a9r4lJoMvyPwSZkP/9an4KL/4eOyAyfq+LfqS2/gryvI7PNBwqvvLbXchKOfk66mmcdu9cdJfcqJ//le///08rTzjtMx2yjeFym/vYHQDtqjrgrne9fbMZCLLTcUxZr++rS62nE7mO99olRx+gtEYDXeRr9As0jzu2rnrTmH/95Z9QzAAAAAA=="
const BEHIND_PATCH = "data:image/webp;base64,UklGRjgEAABXRUJQVlA4WAoAAAAQAAAANwAANwAAQUxQSH4BAAABkINt27E37xfbtm3bm7XZdtKOtjt1s82No23btr/3uY8jzlNjiAgFbtso2Y6Z7w3ij0QU5QeL0LSx1Oz3fAN0G1aPj9T7Bh5FVLz4eGRiuFa/h5vAQ8DHA+1emgPNsWK6VKqEl7tbvLWYPRotb6FK4OWe8VGGvMHQ/ZKIJPD+xKI8e06vduquz5AY8Hy9uzqKdWFClrzuV5AkqGuidDgTnWc8gJQESPpwpNdLUyhsatZ+BRiIIMKrPZXGjGpQuPPmBwAkVcLtDiNG1XDO6l114pkKkMTtdk4VQsMirHTu7htvVeBBlzH3ITZwz2yeuXr/haMNlpqce2/IzjV2DsvO9TdRGFXPJ7RfQoIDAwJCo50URtd749mTp06dOt0vp441anAekbMYTiZrMhJykiQNkS8TWDkFGup+nfh/CqTSNyHoKAAQETsWdSsOPf4CgCR9YUQIoWkaVDJx28XXBKj9MIuWfULT4n03Xk3gRRn8jBq6pdWn8H8Vh3ydRmMEVlA4IJQCAACQEACdASo4ADgAPj0ai0QiIaETCq4kIAPEoA1AgQHoYuvUA0AHmA/Yr9K+wB6AH9j6iv0AP1A9L72J/2l9gD9Oc0A/gD8h9APoPzi/TnsE/x/+h/8HgK/0zMPi+WynVwS9dO5Zr/Vvh7RPVIQ/2Z2VkSVhvkm6p/KFY5hza9mDG1TzMBLkOUF0oIodbHAA/vwQP/sNk55tlNLCoDLkl9vv9OUt6OQ9Rpntvwq2JWkQcN/NxYrEd6J/ysO4UKDcQa+wjLQH3UfIuoxdac5Z/NrJxQNWY0+SLTYS1srkXj09vsNM0UnZtsT7hrQ7fWbR+/1nZyx+S2Nrkf6jwn5fQeq2G9Zn//LCeufRd8RVABcT3+hscKkP+4WSNo2SX/ujTe09uY2wtjuVovmFd6vUkzikE/jra5qaGO8ipiD35J8iQaG/+GvtZhLZDP8ilA4aXscCEwk9atln/93mTLrNGy60nEqK9Jb24mgrZAM+2tKbLJNNBY9u8Ww7hJDAhztks1Du5FrNNCRzKdclRm+2oip/uvUwTxrJWtTunuH+Gx+HtoPvTOV+hwcq182RtzZ5/wodpAnxF19TLuyT6LtIk3oJOT+pwoxoEAVIo7WclsrXRvcPvWpe7b7vd+0AmgL6CpjeEB2Aee7Q9AUDVMctxSVAVucngo4HVVBdfY4LGqbVrv8rd2Bb3PPAwoVKyWFaM4tZN+bPM4p1fpibW6ZdBk+kJVCynJl9Z3tLGqcP+gEJqQVyej/qIL/dMytleO30EfsVaq1w2HEFx/k9w/KIzP/Mdm+DQRlmMXmiXrn53/8S7dq+sfRudCQ0/Nyl+tTJGo2NQt25auCYoVeIIWPUXg8WlEEM/zO1suKu/MGZz2oRpY0JAAA="

/** Tiny alpha masks (half resolution) that cut the arm out of the picture. */
const ARM_MASK = "data:image/png;base64,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"
const BASE_MASK = "data:image/png;base64,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"
const maskCss = (u: string): any => ({ WebkitMaskImage: `url(${u})`, maskImage: `url(${u})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" })
const PIVOT = `${(182 / W) * 100}% ${(452 / H) * 100}%`

/** Arm angle (degrees, positive lifts the arm) per gesture. */
const ARM: Record<string, { deg: number; wave?: boolean }> = {
  rest: { deg: 0 }, tablet: { deg: 0 }, wave: { deg: 6, wave: true }, cheer: { deg: 24, wave: true }, point: { deg: 12 },
  palms: { deg: -5 }, hip: { deg: -10 }, think: { deg: -8 }, ear: { deg: 8 }, oops: { deg: 16 }, droop: { deg: -12 },
}

/** What each mood does by default, and the gestures it cycles through while speaking. */
const MOOD: Record<Mood, { pose: string; talk: string[]; amb: string[] }> = {
  idle: { pose: "rest", talk: ["wave", "point", "palms", "wave", "rest"], amb: ["wave", "point"] },
  happy: { pose: "rest", talk: ["wave", "cheer", "point", "wave"], amb: ["wave", "cheer"] },
  cheering: { pose: "cheer", talk: ["cheer", "wave", "cheer", "point"], amb: ["wave", "cheer"] },
  explaining: { pose: "point", talk: ["point", "wave", "palms", "point", "rest"], amb: ["point", "wave"] },
  thinking: { pose: "think", talk: ["think", "palms", "think", "point"], amb: [] },
  oops: { pose: "oops", talk: ["oops", "palms", "oops"], amb: [] },
  sad: { pose: "droop", talk: ["droop", "palms", "droop"], amb: [] },
  listening: { pose: "ear", talk: ["ear", "rest", "ear"], amb: [] },
  sleep: { pose: "droop", talk: ["droop"], amb: [] },
}

type Eyes = "open" | "happy" | "sleep"
type Brow = { y: number; l: number; r: number } // vertical offset, extra tilt of left brow, extra tilt of right brow (degrees)
const FACE: Record<Mood, { eyes: Eyes; brow: Brow; mouth: string; gaze?: [number, number]; tilt: number; squash?: number }> = {
  idle: { eyes: "open", brow: { y: 0, l: 0, r: 0 }, mouth: "grin", tilt: 0 },
  happy: { eyes: "happy", brow: { y: -8, l: 14, r: -14 }, mouth: "wide", tilt: -2 },
  cheering: { eyes: "happy", brow: { y: -14, l: 16, r: -16 }, mouth: "wide", tilt: 0 },
  explaining: { eyes: "open", brow: { y: -8, l: 8, r: -8 }, mouth: "grin", tilt: 1 },
  thinking: { eyes: "open", brow: { y: -6, l: 10, r: 16 }, mouth: "flat", gaze: [5, -5], tilt: 4 },
  oops: { eyes: "open", brow: { y: -12, l: -14, r: 14 }, mouth: "o", gaze: [0, 1], tilt: -2 },
  sad: { eyes: "open", brow: { y: 8, l: -20, r: 20 }, mouth: "frown", gaze: [0, 4], tilt: -3, squash: 0.97 },
  listening: { eyes: "open", brow: { y: -6, l: 6, r: -6 }, mouth: "smile", gaze: [0, 0], tilt: 4 },
  sleep: { eyes: "sleep", brow: { y: 10, l: 18, r: -18 }, mouth: "tiny", tilt: 5, squash: 0.98 },
}

/** Mouth shapes in face space (origin = centre of the mouth). */
const MOUTH: Record<string, { d: string; fill?: boolean; tongue?: boolean; ellipse?: boolean }> = {
  grin: { d: "M-38 -14 Q0 -24 38 -14 Q34 28 0 30 Q-34 28 -38 -14 Z", fill: true, tongue: true },
  wide: { d: "M-46 -18 Q0 -30 46 -18 Q42 40 0 44 Q-42 40 -46 -18 Z", fill: true, tongue: true },
  open: { d: "M-24 -12 Q0 -20 24 -12 Q22 22 0 24 Q-22 22 -24 -12 Z", fill: true, tongue: true },
  o: { d: "", ellipse: true, fill: true },
  smile: { d: "M-32 -6 Q0 24 32 -6" },
  closed: { d: "M-30 0 Q0 14 30 0" },
  frown: { d: "M-28 16 Q0 -14 28 16" },
  flat: { d: "M-26 4 Q-9 11 3 4 Q16 -3 28 4" },
  tiny: { d: "M-14 2 Q0 13 14 2" },
}
const VISEMES = ["open", "grin", "closed", "wide", "open", "o", "smile", "grin"]

const CSS = `
@keyframes jyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3%)}}
@keyframes jyBreathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.026)}}
@keyframes jySway{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1deg)}}
@keyframes jyTalk{0%,100%{transform:translateY(0) rotate(-1.4deg)}30%{transform:translateY(-1.6%) rotate(0deg)}60%{transform:translateY(0) rotate(1.4deg)}80%{transform:translateY(-1%) rotate(0deg)}}
@keyframes jyBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4%)}}
@keyframes jyArmWave{0%,100%{transform:rotate(var(--a0))}50%{transform:rotate(var(--a1))}}
@keyframes jyArmIdle{0%,100%{transform:rotate(var(--a0))}50%{transform:rotate(calc(var(--a0) + 3deg))}}
@keyframes jyPop{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
@keyframes jyZ{0%{opacity:0;transform:translate(0,12px) scale(.7)}40%{opacity:1}100%{opacity:0;transform:translate(14px,-30px) scale(1.15)}}
.jy-wrap{position:relative;display:inline-block;flex-shrink:0}
.jy-box{position:relative;height:100%;aspect-ratio:626/840;margin:0 auto;max-width:100%}
.jy-fill{position:absolute;inset:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none;pointer-events:none}
.jy-float{position:absolute;inset:0;animation:jyFloat 3.6s ease-in-out infinite}
.jy-body{position:absolute;inset:0;transform-origin:50% 96%}
.jy-breathe{animation:jyBreathe 3.4s ease-in-out infinite}
.jy-breathe.jy-slow{animation-duration:5.2s}
.jy-sway{animation:jySway 4.6s ease-in-out infinite}
.jy-talk{animation:jyTalk .55s ease-in-out infinite}
.jy-bounce{animation:jyBounce .5s ease-in-out infinite}
.jy-arm{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;user-select:none;-webkit-user-drag:none;animation:jyArmIdle 4s ease-in-out infinite}
.jy-arm.jy-waving{animation:jyArmWave .5s ease-in-out infinite}
.jy-armmove{transition:transform .5s cubic-bezier(.34,1.3,.64,1)}
.jy-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.jy-pop{animation:jyPop 1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.jy-z{animation:jyZ 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.jy-fx{position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:5}
.jy-bub{position:absolute;bottom:55%;border-radius:50%;opacity:0;background:radial-gradient(circle at 30% 28%,#fff 0 14%,rgba(190,170,255,.35) 38%,rgba(130,170,255,.28) 100%);border:1.5px solid rgba(255,255,255,.85);box-shadow:inset 0 0 6px rgba(150,130,255,.35),0 0 0 0 rgba(160,140,255,.5);animation-name:jyBub;animation-timing-function:ease-out;animation-fill-mode:forwards}
.jy-ha{position:absolute;left:50%;top:-4%;transform:translateX(-50%);white-space:nowrap;font-weight:900;font-size:13px;color:#7552ee;background:#fff;border:1.5px solid #d9ccff;border-radius:999px;padding:2px 9px;box-shadow:0 4px 10px rgba(117,82,238,.18);animation:jyHa 1.5s ease-out forwards}
@keyframes jyBub{0%{opacity:0;transform:translate(0,0) scale(.4)}10%{opacity:1}74%{opacity:1;transform:translate(var(--dx),-120px) scale(1)}80%{opacity:1;transform:translate(var(--dx),-128px) scale(1.35);box-shadow:inset 0 0 6px rgba(150,130,255,.35),0 0 0 6px rgba(160,140,255,.35)}100%{opacity:0;transform:translate(var(--dx),-134px) scale(1.7);box-shadow:inset 0 0 0 rgba(150,130,255,0),0 0 0 14px rgba(160,140,255,0)}}
@keyframes jyHa{0%{opacity:0;transform:translate(-50%,8px) scale(.6)}15%{opacity:1;transform:translate(-50%,0) scale(1.08)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-14px) scale(1)}}
.jy-ease{transition:transform .5s cubic-bezier(.34,1.45,.64,1)}
.jy-fast{transition:transform .16s ease-out}
@media (prefers-reduced-motion: reduce){.jy-float,.jy-breathe,.jy-talk,.jy-sway,.jy-bounce,.jy-arm,.jy-arm.jy-waving,.jy-pop,.jy-z{animation:none}.jy-ease,.jy-fast,.jy-armmove{transition:none}.jy-bub{animation-duration:1ms!important}}
`

const INK = "#1a1644"
let preloaded = false
function preload() {
  if (preloaded || typeof window === "undefined") return
  preloaded = true
  const i = new Image(); i.src = IMG
}

type Bubble = { id: number; x: number; s: number; dx: number; d: number; delay: number }
const HA = ["ha ha!", "hehe!", "hihi!", "tee-hee!", "ha ha ha!"]
let bubbleId = 0

/** A soft "pop", made on the spot so no sound file is needed. Only ever played in answer to a tap. */
function pop(ctx: AudioContext, at: number) {
  try {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = "sine"
    o.frequency.setValueAtTime(520 + Math.random() * 380, ctx.currentTime + at)
    o.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + at + 0.07)
    g.gain.setValueAtTime(0.05, ctx.currentTime + at)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.09)
    o.connect(g).connect(ctx.destination)
    o.start(ctx.currentTime + at); o.stop(ctx.currentTime + at + 0.1)
  } catch {}
}

export function JellyAvatar({ mood: moodProp = "idle", size = 80, talking: talkingProp = false, className = "", touchy = false }: { mood?: Mood; size?: number; talking?: boolean; className?: string; doctor?: boolean; touchy?: boolean }) {
  useEffect(preload, [])
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")

  // touch: Jelly bursts out laughing and blows a stream of bubbles that pop
  const [laugh, setLaugh] = useState(false)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [ha, setHa] = useState<{ id: number; t: string } | null>(null)
  const timers = useRef<any[]>([])
  const audio = useRef<AudioContext | null>(null)
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])
  const poke = () => {
    if (!touchy) return
    setLaugh(true)
    setHa({ id: ++bubbleId, t: HA[Math.floor(Math.random() * HA.length)] })
    const fresh: Bubble[] = Array.from({ length: 9 + Math.floor(Math.random() * 4) }, () => ({
      id: ++bubbleId, x: 22 + Math.random() * 56, s: 12 + Math.random() * 22, dx: (Math.random() - 0.5) * 70, d: 1100 + Math.random() * 900, delay: Math.random() * 450,
    }))
    setBubbles((b) => [...b, ...fresh])
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext
      if (AC) {
        audio.current = audio.current || new AC()
        if (audio.current!.state === "suspended") audio.current!.resume()
        fresh.forEach((b) => pop(audio.current!, (b.delay + b.d * 0.78) / 1000))
      }
    } catch {}
    timers.current.push(setTimeout(() => setBubbles((b) => b.filter((x) => !fresh.some((f) => f.id === x.id))), 2600))
    timers.current.push(setTimeout(() => setLaugh(false), 1700))
    timers.current.push(setTimeout(() => setHa(null), 1500))
  }
  const mood: Mood = laugh && moodProp !== "sleep" ? "cheering" : moodProp
  const talking = laugh || talkingProp
  const M = MOOD[mood], F = FACE[mood]

  // gesture: cycles while speaking; an occasional spontaneous gesture when idle
  const [gest, setGest] = useState<string | null>(null)
  useEffect(() => {
    let t: any, o: any, n = 0
    if (talking) {
      const tick = () => { setGest(M.talk[n++ % M.talk.length]); t = setTimeout(tick, 1100 + Math.random() * 900) }
      t = setTimeout(tick, 250)
    } else {
      setGest(null)
      if (M.amb.length) {
        const loop = () => { t = setTimeout(() => { setGest(M.amb[Math.floor(Math.random() * M.amb.length)]); o = setTimeout(() => { setGest(null); loop() }, 2200) }, 4500 + Math.random() * 4000) }
        loop()
      }
    }
    return () => { clearTimeout(t); clearTimeout(o) }
  }, [talking, mood])
  const arm = ARM[gest || M.pose] || ARM.rest

  // blink
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (F.eyes !== "open") return
    let t: any, o: any
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true)
        o = setTimeout(() => {
          setBlink(false)
          if (Math.random() < 0.25) { o = setTimeout(() => { setBlink(true); o = setTimeout(() => setBlink(false), 110) }, 160) }
          loop()
        }, 120)
      }, 1800 + Math.random() * 3200)
    }
    loop()
    return () => { clearTimeout(t); clearTimeout(o) }
  }, [F.eyes])

  // gaze: the eyes wander like a person's
  const [gaze, setGaze] = useState<[number, number]>([0, 0])
  useEffect(() => {
    if (F.gaze) { setGaze(F.gaze); return }
    if (F.eyes !== "open") { setGaze([0, 0]); return }
    let t: any
    const loop = () => { t = setTimeout(() => { setGaze([Math.round((Math.random() * 2 - 1) * 5), Math.round((Math.random() * 2 - 1) * 4)]); loop() }, 1400 + Math.random() * 2400) }
    loop()
    return () => clearTimeout(t)
  }, [mood])

  // mouth: lip-sync while speaking
  const [vi, setVi] = useState(0)
  useEffect(() => {
    if (!talking || mood === "sleep") return
    const t = setInterval(() => setVi((v) => (v + 1 + Math.floor(Math.random() * 2)) % VISEMES.length), 130)
    return () => clearInterval(t)
  }, [talking, mood])
  const mouthKey = talking && mood !== "sleep" ? VISEMES[vi] : F.mouth
  const mouth = MOUTH[mouthKey]
  const by = F.brow.y + (talking && vi % 3 === 0 ? -5 : 0)
  const open = F.eyes === "open"
  const [gx, gy] = gaze

  const armStyle: any = { ...maskCss(ARM_MASK), transformOrigin: PIVOT, ["--a0" as any]: `${arm.deg}deg`, ["--a1" as any]: `${arm.deg + 22}deg` }
  const mid = `m${uid}`

  return (
    <div
      className={`jy-wrap ${className}`}
      style={{ width: size, height: size, ...(touchy ? { cursor: "pointer", WebkitTapHighlightColor: "transparent" } : null) }}
      {...(touchy
        ? { role: "button", tabIndex: 0, "aria-label": "Tap Jelly", onClick: poke, onKeyDown: (e: any) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); poke() } } }
        : { role: "img", "aria-label": `Jelly is ${mood}` })}
    >
      <style>{CSS}</style>
      {touchy && (
        <div className="jy-fx" aria-hidden="true">
          {ha && <span key={ha.id} className="jy-ha">{ha.t}</span>}
          {bubbles.map((b) => (
            <i key={b.id} className="jy-bub" style={{ left: b.x + "%", width: b.s, height: b.s, animationDuration: b.d + "ms", animationDelay: b.delay + "ms", ["--dx" as any]: b.dx + "px" }} />
          ))}
        </div>
      )}
      <div className="jy-box">
        <div className="jy-float">
          <div className={`jy-body ${talking ? "jy-talk" : mood === "listening" || mood === "thinking" ? "" : "jy-sway"}`}>
            <div className={`jy-body jy-breathe ${mood === "sleep" ? "jy-slow" : ""} ${talking && mood === "cheering" ? "jy-bounce" : ""}`}
              style={F.squash ? { transform: `scaleY(${F.squash})` } : undefined}>
              <div className="jy-body jy-ease" style={{ transform: `rotate(${F.tilt}deg)`, filter: mood === "sad" ? "saturate(.85) brightness(.97)" : undefined }}>
                {/* behind the arm, so the swing never opens a hole */}
                <img className="jy-fill" alt="" draggable={false} src={BEHIND_PATCH} style={{ left: px(0), top: py(300), width: px(224), height: py(224), right: "auto", bottom: "auto" }} />
                {/* the artwork, with the raised arm lifted out */}
                <img className="jy-fill" alt="" draggable={false} src={IMG} style={maskCss(BASE_MASK)} />
                {/* blank face skin */}
                <img className="jy-fill" alt="" draggable={false} src={FACE_PATCH} style={{ left: px(150), top: py(70), width: px(380), height: py(280), right: "auto", bottom: "auto" }} />

                {/* live face */}
                <svg className="jy-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
                  <defs>
                    <linearGradient id={mid + "e"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#120e36" /><stop offset=".6" stopColor="#201a5a" /><stop offset="1" stopColor="#4a3fa8" /></linearGradient>
                    <clipPath id={mid + "m"}><path d={mouth.d || "M0 0"} /></clipPath>
                  </defs>
                  <g transform="translate(344.5 227.5) rotate(-13.4)">
                    {/* eyebrows */}
                    {([-1, 1] as const).map((k) => (
                      <g key={"b" + k} className="jy-ease" style={{ transform: `translate(${k < 0 ? -118 : 122}px,${(k < 0 ? -94 : -100) + by}px) rotate(${k < 0 ? -22 + F.brow.l : 24 + F.brow.r}deg)` }}>
                        <path d="M-30 6 Q0 -10 30 6" fill="none" stroke="#27235a" strokeWidth="13" strokeLinecap="round" opacity={mood === "sleep" ? 0.55 : 0.92} />
                      </g>
                    ))}
                    {/* eyes */}
                    {([-1, 1] as const).map((k) => (
                      <g key={"e" + k} transform={`translate(${k * 114.5},0)`}>
                        {open ? (
                          <g className="jy-fast" style={{ transform: `scaleY(${blink ? 0.06 : 1})`, transformBox: "fill-box", transformOrigin: "center" }}>
                            <ellipse cx={gx * 0.5} cy={gy * 0.5} rx="41" ry="52" fill={`url(#${mid}e)`} />
                            <g className="jy-fast" style={{ transform: `translate(${gx}px,${gy}px)` }}>
                              <ellipse cx="-17" cy="-24" rx="12" ry="15" fill="#fff" />
                              <circle cx="17" cy="28" r="6" fill="#fff" opacity=".55" />
                            </g>
                          </g>
                        ) : F.eyes === "happy" ? (
                          <path d="M-36 12 Q0 -42 36 12" fill="none" stroke={INK} strokeWidth="14" strokeLinecap="round" />
                        ) : (
                          <path d="M-36 -8 Q0 34 36 -8" fill="none" stroke={INK} strokeWidth="13" strokeLinecap="round" />
                        )}
                      </g>
                    ))}
                    {/* glasses */}
                    {mood === "explaining" && (
                      <g fill="none" stroke="#25235a" strokeWidth="8">
                        <circle cx="-114.5" cy="0" r="64" /><circle cx="114.5" cy="0" r="64" /><path d="M-52 -6 Q0 -26 52 -6" />
                      </g>
                    )}
                    {/* mouth */}
                    <g transform="translate(2 47)">
                      {mouth.ellipse ? (
                        <ellipse cx="0" cy="8" rx="15" ry="20" fill="#3a1646" />
                      ) : mouth.fill ? (
                        <g>
                          <path d={mouth.d} fill="#3a1646" stroke="#2a1030" strokeWidth="3" strokeLinejoin="round" />
                          {mouth.tongue && <g clipPath={`url(#${mid}m)`}><ellipse cx="0" cy="28" rx="24" ry="13" fill="#ea92b6" /></g>}
                        </g>
                      ) : (
                        <path d={mouth.d} fill="none" stroke="#2a1030" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </g>
                  </g>
                </svg>

                {/* the swinging arm: the same picture, clipped to the arm */}
                <img className={`jy-fill jy-arm ${arm.wave ? "jy-waving" : ""}`} alt="" draggable={false} src={IMG} style={armStyle} />

                {/* extras drawn on top */}
                <svg className="jy-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
                  {mood === "listening" && (
                    <g>
                      <path d="M62 250 C30 -40 600 -70 580 240" fill="none" stroke="#1e1e30" strokeWidth="26" strokeLinecap="round" />
                      <rect x="22" y="170" width="56" height="120" rx="26" fill="#1e1e30" /><rect x="548" y="170" width="56" height="120" rx="26" fill="#1e1e30" />
                      <rect x="34" y="192" width="16" height="76" rx="8" fill="#3a3a58" /><rect x="576" y="192" width="16" height="76" rx="8" fill="#3a3a58" />
                    </g>
                  )}
                  {mood === "oops" && <path className="jy-pop" d="M520 120 C536 146 542 160 520 180 C498 160 504 146 520 120 Z" fill="#7fc4ff" stroke="#fff" strokeWidth="4" />}
                  {mood === "sad" && <path className="jy-pop" d="M222 330 C236 352 242 366 222 384 C202 366 208 352 222 330 Z" fill="#7fc4ff" stroke="#fff" strokeWidth="4" />}
                  {mood === "thinking" && <text className="jy-pop" x="520" y="90" fontSize="110" fontWeight="800" fill="#8e86ff">?</text>}
                  {mood === "sleep" && <text className="jy-z" x="500" y="90" fontSize="96" fontWeight="800" fill="#8e86ff">z</text>}
                  {(mood === "happy" || mood === "cheering") && (
                    <g className="jy-pop" stroke="#8ea2ff" strokeWidth="12" strokeLinecap="round">
                      <path d="M560 40 L580 -4" /><path d="M596 100 L632 84" /><path d="M60 40 L40 -4" />
                    </g>
                  )}
                  {mood === "cheering" && <text className="jy-pop" x="10" y="120" fontSize="76" fill="#ff7fb0">♥</text>}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
