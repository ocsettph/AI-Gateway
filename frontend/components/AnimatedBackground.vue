<template>
  <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div class="animated-grid"></div>
    <div class="spotlight-overlay"></div>
    <div class="floating-shapes">
      <img src="/assets/icon.png" alt="UBU AI FLOW" class="shape shape-1" />
      <img src="/assets/icon.png" alt="UBU AI FLOW" class="shape shape-2" />
      <img src="/assets/icon.png" alt="UBU AI FLOW" class="shape shape-3" />
      <img src="/assets/icon.png" alt="UBU AI FLOW" class="shape shape-4" />
      <img src="/assets/icon.png" alt="UBU AI FLOW" class="shape shape-5" />
      <img src="/assets/icon.png" alt="UBU AI FLOW" class="shape shape-6" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

// Randomize float/rotate speeds and delays so they are not in sync
const randomizeAnimations = () => {
  const shapes = document.querySelectorAll<HTMLElement>(".shape");
  shapes.forEach((el) => {
    const floatDur = (Math.random() * 4 + 4).toFixed(2); // 4s - 8s (faster)
    const spinDur = (Math.random() * 8 + 8).toFixed(2); // 8s - 16s
    const floatDelay = (Math.random() * 3).toFixed(2); // 0 - 3s
    const spinDelay = (Math.random() * 3).toFixed(2);
    el.style.setProperty("--float-dur", `${floatDur}s`);
    el.style.setProperty("--spin-dur", `${spinDur}s`);
    el.style.setProperty("--float-delay", `${floatDelay}s`);
    el.style.setProperty("--spin-delay", `${spinDelay}s`);
  });
};

onMounted(() => {
  // Initial random setup and keep randomizing periodically
  randomizeAnimations();
  const intervalId = window.setInterval(randomizeAnimations, 7000);
  // store on window for cleanup
  (window as any).__animatedBgInterval = intervalId;
});

onUnmounted(() => {
  const intervalId = (window as any).__animatedBgInterval as number | undefined;
  if (intervalId) window.clearInterval(intervalId);
});
</script>

<style scoped>
.animated-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 150px; /* หยุดก่อน footer */
  background-color: transparent;
  background-image: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.08) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: grid-shift 3s linear infinite;
  /* Radial fade-out mask: จางรอบวงกลมที่ขอบ */
  -webkit-mask-image: radial-gradient(
    ellipse 80% 80% at center,
    black 20%,
    transparent 70%
  );
  mask-image: radial-gradient(
    ellipse 80% 80% at center,
    black 20%,
    transparent 70%
  );
  will-change: background-position;
}

@keyframes grid-shift {
  0% {
    background-position: 0 0, 0 0;
  }
  100% {
    background-position: 48px 48px, 48px 48px;
  }
}

.spotlight-overlay {
  position: absolute;
  inset: -20%;
  background: none;
  pointer-events: none;
}

.floating-shapes {
  position: absolute;
  inset: 0;
}
.shape {
  position: absolute;
  width: 26px;
  height: 26px;
  opacity: 0.35;
  animation: float var(--float-dur, 8s) ease-in-out infinite
      var(--float-delay, 0s),
    spin var(--spin-dur, 12s) linear infinite var(--spin-delay, 0s);
  will-change: transform;
}
.shape-1 {
  left: 18%;
  top: 28%;
  animation-duration: 13s;
}
.shape-2 {
  left: 78%;
  top: 35%;
  animation-duration: 16s;
}
.shape-3 {
  left: 64%;
  top: 72%;
  animation-duration: 15s;
}
.shape-4 {
  left: 32%;
  top: 68%;
  animation-duration: 17s;
}
.shape-5 {
  left: 12%;
  top: 58%;
  animation-duration: 14s;
}
.shape-6 {
  left: 86%;
  top: 18%;
  animation-duration: 18s;
}

@keyframes float {
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-12px) scale(1.04);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from {
    rotate: 0deg;
  }
  to {
    rotate: 360deg;
  }
}

:global(.dark) .animated-grid {
  background-color: transparent;
  background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.035) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  /* ไม่ใช้ mask เพื่อหลีกเลี่ยงปัญหาฝ้าหลังโหลด */
  -webkit-mask-image: none;
  mask-image: none;
}

:global(.dark) .shape {
  opacity: 0.45;
}
</style>
