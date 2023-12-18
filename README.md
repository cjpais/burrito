# brain

_Note: This is a work in progress_

This is an experiment to play with personal data in a friendly and easy way.
The core idea is to be able to ask the `brain` any query in natural language
and return revelevant information. This could be `json` for building a webpage
or `text`.

It is built to be flexible and extensible, to encourage rapid prototyping
and experiementation.

The goal is to build a playground for personal data and find insight into self.
That means it should be able to accept all kinds of data sources and have them
be easily added to the `brain`. The first such sources are pure files as they
are the simplest to work with. I intend for the `brain` to consume API's
and data sources like Spotify, Twitter, Discord, Email, and Messages.

How these data sources easily integrate into storage and retrieval is unknown
and part of the experiment. Everything is stored directly on the filesystem
to start and is intended to be run and hosted from your own computer for now.

## Architecture Overview

There are two main entry points to the application.

`storage` - This is how data will be stored, and what data processing pipeline is
effective for storing that kind of data.

`retrieval` - This is how data will be retrieved. Other applications will primarily
be interacting with this module

On `brain` start, the first thing that happens is that data is loaded from the filesystem
and verified for it's metadata integrity. If the metadata is not up to date, it will
kick off the data processing pipeline for that `type`

This is similar to when a new 'memory' is `stored`. Upon recieving the request to store
a new 'memory', a pipeline is kicked off to process the data and store it in the filesystem.

The pipeline is one of the fundamental units at this point in time. It is meant to be
easily flexible and extensible. So much so that the client may be able to invoke it's
own pipeline. Adding new steps and modules to the pipeline should be easy and intuitive.
There is so much to be discovered in the data and how LLM's interact with it, and
ultimately will be able to retrieve it later.

Right now retrieval is not deeply implemented. It is the goal of this week. Some of it
will be RAG using ChromaDB as the vector database. Everything else is TBD at the moment.
A lot of the processing on the `storage` step will be to aid the retrieval. That is why
all of it is in flexible pipeline steps, so it aids in playing with many different
retrieval methods from a common and consistent data source.

## Install

To install dependencies:

```bash
bun install
```

To run web server

```bash
bun dev
```
