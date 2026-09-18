/**
 * lib/animations.ts
 * Centralized Framer Motion variants for the entire application.
 * Import from here — never define inline animation objects in pages.
 */

import type { Variants } from 'framer-motion'

// ─── Page Transitions ─────────────────────────────────────────────────────────

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── Fade Only ────────────────────────────────────────────────────────────────

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
}

// ─── Slide Up ─────────────────────────────────────────────────────────────────

export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

// ─── Stagger Container ────────────────────────────────────────────────────────

export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.05,
    },
  },
}

// ─── Stagger Item ─────────────────────────────────────────────────────────────

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── Dropdown (spring) ────────────────────────────────────────────────────────

export const dropdownVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: -6 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -6,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 16 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 26 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
}

export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
}

// ─── Mobile Menu ──────────────────────────────────────────────────────────────

export const mobileMenuVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── Button (use as whileHover / whileTap values) ────────────────────────────

export const buttonMotion = {
  whileHover: { scale: 1.02 },
  whileTap:   { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 25 },
}

// ─── Card Hover ───────────────────────────────────────────────────────────────

export const cardMotion = {
  whileHover: { y: -2, transition: { duration: 0.22, ease: 'easeOut' } },
}
