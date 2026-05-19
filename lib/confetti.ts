import confetti from 'canvas-confetti'

export function celebrateFirstSubscription() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#0D7377', '#14A085', '#2ECC7A', '#FAF7F2'],
    ticks: 200,
  })
}
