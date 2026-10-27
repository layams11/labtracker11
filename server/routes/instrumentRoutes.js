import express from 'express';
import {
  getAllInstruments,
  getInstrumentById,
  createInstrument,
  updateInstrument,
  deleteInstrument,
} from '../controllers/instrumentController.js';

const router = express.Router();

router.route('/')
  .get(getAllInstruments)
  .post(createInstrument);

router.route('/:id')
  .get(getInstrumentById)
  .put(updateInstrument)
  .delete(deleteInstrument);

export default router;
