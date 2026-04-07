const express = require("express");
const router = express.Router();
const { predictTaste } = require("../ai/etongueModel");

router.post("/predict-taste", async (req, res) => {
    try {
        const { tds, voc, r, g, b, freq } = req.body;

        // ✅ Validation
        if (
            tds === undefined ||
            voc === undefined ||
            r === undefined ||
            g === undefined ||
            b === undefined ||
            freq === undefined
        ) {
            return res.json({ success: false, message: "Invalid input" });
        }
        const taste = await predictTaste(tds, voc, r, g, b, freq);

        // 🔥 Optional: taste type mapping
        const typeMap = {
            Amla: "Sour",
            Lavana: "Salty",
            Madhura: "Sweet",
            Nilavembu: "Bitter"
        };

        res.json({
            success: true,
            taste,
            type: typeMap[taste]
        });

    } catch (err) {
        console.log(err);
        res.json({ success: false });
    }
});

module.exports = router;