const express = require('express')

const router = express.Router()
const {
    createWorkout,
    getWorkout,
    getWorkouts
} = require('../controllers/workoutControllers')

// GET all workouts
router.get('/', getWorkouts)

// GET single workouts
router.get('/:id', getWorkout)

// POST new workouts
router.post('/', createWorkout)

// DELETE new workouts
router.delete('/:id', (req, res) => {
    res.json({mssg: 'delete a workout'})
})

// UPDATE a workouts
router.patch('/:id', (req, res) => {
    res.json({mssg: 'update a workout'})
})

module.exports = router