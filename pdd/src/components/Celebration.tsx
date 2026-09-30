import { AnimatePresence, motion } from 'framer-motion'
import './Celebration.css'

type Props = {
  open: boolean
  title: string
  subtitle: string
  onClose: () => void
}

export function Celebration({ open, title, subtitle, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cele-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="cele-card"
            initial={{ scale: 0.6, rotate: -8, y: 40 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cele-burst" aria-hidden>
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="cele-confetti"
                  initial={{ opacity: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: [-10, -80 - (i % 4) * 20],
                    x: ((i % 2 ? 1 : -1) * (20 + i * 8)),
                    scale: [0.4, 1.2, 0.6],
                    rotate: i * 30,
                  }}
                  transition={{ duration: 1.2, delay: 0.05 * i }}
                />
              ))}
            </div>
            <motion.div
              className="cele-stamp"
              initial={{ scale: 2.2, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, rotate: -8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
            >
              砍成功
            </motion.div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
            <button type="button" className="pdd-btn pdd-btn-primary" onClick={onClose}>
              好的，继续拼
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
