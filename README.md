
# nostrdb-mcp

A Model Context Protocol server for nostrdb.

## What?

MCP is a protocol that enables LLMs to interface with tools and systems. This server enables LLMs to use the `ndb` nostrdb command line tool to make local nostr queries.

By default, it uses your [Notedeck](https://github.com/damus-io/notedeck) nostrdb directory so that it can search notes your notedeck has seen.

## Install

Make sure you have `ndb` on your path by [compiling it via the nostrdb repo](https://github.com/damus-io/nostrdb) by typing `make ndb` and copying it to your path.

### Goose

You can configure [goose](https://github.com/block/goose) to use this tool:

```
$ goose configure
```

When adding a provider, use: `npx -y nostrdb-mcp`

You can create a temporary session to try it out like so:

```
$ goose session --with-extension `npm -y nostrdb-mcp`
```

## Example

![](https://cdn.jb55.com/s/e2ed680f1de0e5e0.png)
