"use client"

import { motion, type Variants, type HTMLMotionProps } from "framer-motion"
import { type ReactNode } from "react"

const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

interface FadeInUpProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  children: ReactNode
  delay?: number
  duration?: number
}

export function FadeInUp({
  children,
  delay = 0,
  duration = 0.5,
  className,
  ...rest
}: FadeInUpProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeVariants}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
}

interface StaggerGridProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  children: ReactNode
}

export function StaggerGrid({ children, className, ...rest }: StaggerGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={containerVariants}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  children: ReactNode
}

export function StaggerItem({ children, className, ...rest }: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants} className={className} {...rest}>
      {children}
    </motion.div>
  )
}
