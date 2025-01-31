#!/usr/bin/env node

import express from 'express';
import Ajv from 'ajv';

const app = express();
const port = 3000;
const ajv = new Ajv();

class MCP {
    constructor() {
        this.tools = {};
    }

    registerTool(name, handler, schema) {
        this.tools[name] = { handler, schema };
    }

    async handleRequest(req, res) {
        const { tool, params } = req.body;

        if (this.tools[tool]) {
            const { handler, schema } = this.tools[tool];
            const validate = ajv.compile(schema);
            const valid = validate(params);

            if (!valid) {
                return res.json({ status: 'error', message: 'Invalid parameters', errors: validate.errors });
            }

            try {
                const result = await handler(params);
                res.json({ status: 'success', result });
            } catch (error) {
                res.json({ status: 'error', message: error.message });
            }
        } else {
            res.json({ status: 'error', message: 'Tool not found' });
        }
    }
}

const mcp = new MCP();

// Register a hello_world command with schema validation
const helloWorldSchema = {
    type: 'object',
    properties: {},
    required: [],
};

mcp.registerTool('hello_world', async () => {
    return { message: 'Hello, world!' };
}, helloWorldSchema);

app.use(express.json());
app.post('/mcp', (req, res) => mcp.handleRequest(req, res));

app.listen(port, () => {
    console.log(`MCP protocol server running at http://localhost:${port}`);
});