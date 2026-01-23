const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { ObjectId } = require("mongodb");

const router = express.Router();

module.exports = (notificationCollection) => {
  // GET /api/notifications
  router.get(
    "/",
    authMiddleware,
    asyncHandler(async (req, res) => {
      const notifications = await notificationCollection
        .find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      const unreadCount = await notificationCollection.countDocuments({
        userId: req.userId,
        isRead: false,
      });

      res.json({ notifications, unreadCount });
    })
  );

  // PATCH /api/notifications/:id/read
  router.patch(
    "/:id/read",
    authMiddleware,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        throw new AppError("Invalid ID format.", 400);
      }

      const result = await notificationCollection.updateOne(
        { _id: new ObjectId(id), userId: req.userId },
        { $set: { isRead: true } }
      );

      if (result.matchedCount === 0) {
        throw new AppError("Notification not found.", 404);
      }

      res.json({ success: true });
    })
  );

  // PATCH /api/notifications/read-all
  router.patch(
    "/read-all",
    authMiddleware,
    asyncHandler(async (req, res) => {
      await notificationCollection.updateMany(
        { userId: req.userId, isRead: false },
        { $set: { isRead: true } }
      );

      res.json({ success: true });
    })
  );

  // DELETE /api/notifications/:id
  router.delete(
    "/:id",
    authMiddleware,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        throw new AppError("Invalid ID format.", 400);
      }

      const result = await notificationCollection.deleteOne({
        _id: new ObjectId(id),
        userId: req.userId,
      });

      if (result.deletedCount === 0) {
        throw new AppError("Notification not found.", 404);
      }

      res.status(204).send();
    })
  );

  return router;
};
