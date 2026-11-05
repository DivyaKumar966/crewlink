
import { Router } from 'express';
import crypto from 'crypto';
import Project from '../models/Project.js';
import { io } from '../sockets/socket.js';

const router = Router();

router.post('/webhook/:projectId', async (req, res) => {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = req.headers['x-hub-signature-256'];

    // Temporary diagnostic log
    console.log('WEBHOOK CHECK:', {
      hasSecret: !!secret,
      hasSignature: !!signature,
      hasRawBody: !!req.rawBody,
      rawBodyLength: req.rawBody?.length
    });

    if (!secret || !signature || !req.rawBody) {
      return res.status(401).send(
        'Webhook secret or raw request body is missing'
      );
    }

    const expected = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(req.rawBody)
      .digest('hex')}`;

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return res.status(401).send('Invalid webhook signature');
    }

    if (req.headers['x-github-event'] !== 'push') {
      return res.json({ received: true, ignored: true });
    }

    const project = await Project.findOne({
      _id: req.params.projectId,
      deleted: false
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const expectedRepo = String(project.githubRepo || '')
      .replace(/\.git$/, '')
      .toLowerCase();

    const pushedRepo = String(req.body.repository?.html_url || '')
      .replace(/\.git$/, '')
      .toLowerCase();

    if (!expectedRepo || expectedRepo !== pushedRepo) {
      return res.status(403).json({
        message: 'This repository is not linked to the project'
      });
    }

    const payload = {
      repository: req.body.repository?.full_name,
      pusher: req.body.pusher?.name || req.body.sender?.login || 'GitHub user',
      branch: req.body.ref?.split('/').pop(),
      commits: (req.body.commits || []).map(c => ({
        id: c.id,
        message: c.message,
        url: c.url
      })),
      createdAt: new Date()
    };

    io?.to(`project:${project._id}`).emit('github:activity', payload);

    res.json({ received: true });

  } catch (error) {
    console.error('GitHub webhook error:', error);
    res.status(500).json({ message: 'Could not process webhook' });
  }
});

export default router;
