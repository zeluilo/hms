const express = require('express')

const router = express.Router()

// GET all workouts
router.get('/', (req, res) => {
    res.json({mssg: 'get all workout'})
})

// GET single workouts
router.get('/:id', (req, res) => {
    res.json({mssg: 'get single workout'})
})

// POST new workouts
router.post('/', (req, res) => {
    res.json({mssg: 'post new workout'})
})

// DELETE new workouts
router.delete('/:id', (req, res) => {
    res.json({mssg: 'delete a workout'})
})

// UPDATE a workouts
router.patch('/:id', (req, res) => {
    res.json({mssg: 'update a workout'})
})

module.exports = router