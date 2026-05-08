/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import {
  startProposal,
  respondToProposal,
  finalizeProposal,
} from "./services/geminiService.js";
import { Proposal } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type StoredProposal = Proposal & {
  proposalId: string;
  finalCard?: unknown;
};

const proposals = new Map<string, StoredProposal>();

function createProposalId() {
  return `proposal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({
      ok: true,
      message: "AX_DAEGU backend is running",
    });
  });

  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      status: "healthy",
    });
  });

  // 1. POST /api/proposals/start
  app.post("/api/proposals/start", async (req, res) => {
    try {
      const { oneLineReview } = req.body;

      if (!oneLineReview) {
        return res.status(400).json({ error: "oneLineReview is required" });
      }

      const aiResult = await startProposal(oneLineReview);
      const proposalId = createProposalId();

      const newProposal = {
        ...(aiResult as Proposal),
        proposalId,
        originalText: oneLineReview,
        currentRound: 1,
        answers: [],
        isCompleted: false,
        createdAt: new Date().toISOString(),
      } as StoredProposal;

      proposals.set(proposalId, newProposal);

      res.json({
        proposalId,
        ...newProposal,
      });
    } catch (error) {
      console.error("Error starting proposal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 2. POST /api/proposals/:id/respond
  app.post("/api/proposals/:id/respond", async (req, res) => {
    try {
      const { id } = req.params;
      const { answer } = req.body;

      if (!answer) {
        return res.status(400).json({ error: "answer is required" });
      }

      const proposal = proposals.get(id);

      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }

      if (proposal.isCompleted) {
        return res.status(400).json({ error: "Proposal already completed" });
      }

      const aiResult = await respondToProposal(proposal, answer);

      const updatedAnswers = [
        ...proposal.answers,
        {
          round: proposal.currentRound,
          answer,
        },
      ];

      const nextRound = proposal.currentRound + 1;
      const isReadyToFinalize = nextRound > 3;

      const updatedProposal = {
        ...proposal,
        scores: aiResult.updatedScores,
        answers: updatedAnswers,
        currentRound: nextRound,
        counterQuestion:
          aiResult.nextCounterQuestion ?? proposal.counterQuestion,
      } as StoredProposal;

      proposals.set(id, updatedProposal);

      res.json({
        proposalId: id,
        currentRound: nextRound,
        updatedScores: aiResult.updatedScores,
        improvedSummary: aiResult.improvedSummary,
        feedback: aiResult.feedback,
        nextCounterQuestion: aiResult.nextCounterQuestion,
        isReadyToFinalize,
      });
    } catch (error) {
      console.error("Error responding to proposal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 3. POST /api/proposals/:id/finalize
  app.post("/api/proposals/:id/finalize", async (req, res) => {
    try {
      const { id } = req.params;

      const proposal = proposals.get(id);

      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }

      const finalCard = await finalizeProposal(proposal);

      const completedProposal = {
        ...proposal,
        finalCard,
        isCompleted: true,
      } as StoredProposal;

      proposals.set(id, completedProposal);

      res.json({
        proposalId: id,
        finalCard,
        status: "completed",
      });
    } catch (error) {
      console.error("Error finalizing proposal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 4. GET /api/proposals
  app.get("/api/proposals", async (req, res) => {
    try {
      const completedProposals = Array.from(proposals.values())
        .filter((proposal) => proposal.isCompleted)
        .sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        });

      res.json(completedProposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/debug/proposals", (req, res) => {
    res.json(Array.from(proposals.values()));
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();