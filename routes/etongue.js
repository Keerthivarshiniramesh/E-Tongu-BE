const express = require("express");
const router = express.Router();
const { predictTaste } = require("../ai/etongueModel");

router.post("/predict-taste", async (req, res) => {
    try {
        const { ph, tds, voc, r, g, b, freq } = req.body;

        // ✅ Validation
        if (
            ph === undefined ||
            tds === undefined ||
            voc === undefined ||
            r === undefined ||
            g === undefined ||
            b === undefined ||
            freq === undefined
        ) {
            return res.json({ success: false, message: "Invalid input" });
        }

        // ✅ Convert + scale
        const phVal = Number(ph);
        const tdsVal = Number(tds);
        const vocVal = Number(voc) * 10;
        const rVal = Number(r);
        const gVal = Number(g);
        const bVal = Number(b);
        const freqVal = Number(freq);

        // ✅ Check NaN
        if (
            isNaN(phVal) ||
            isNaN(tdsVal) ||
            isNaN(vocVal) ||
            isNaN(rVal) ||
            isNaN(gVal) ||
            isNaN(bVal) ||
            isNaN(freqVal)
        ) {
            return res.json({ success: false, message: "Invalid numeric input" });
        }

        // 🔥 Hybrid Logic (VERY IMPORTANT)
        // Amla = low pH → direct classification
        if (phVal < 4.5) {
            return res.json({
                success: true,
                taste: "Amla",
                type: "Sour"
            });
        }

        // ✅ ML Prediction (with pH included)
        const taste = await predictTaste(
            phVal,
            tdsVal,
            vocVal,
            rVal,
            gVal,
            bVal,
            freqVal
        );

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