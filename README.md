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
a new 'memory', a pipeline is kicked off to process the data and store it in the filesystem. The first step of the pipeline is to store the file on the filesystem.
First the file is hashed. This hash is used to create a directory with the name of
the hash, and then the file is stored in that directory.

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

## Longer Term

Want verything to be run locally instead of calling out to OpenAI. This
means running LLM, Embedding Model, Whisper, and Image->Text locally.

Running these all with `llama.cpp` seems very doable and has been tested already.
They are not integrated into the pipeline yet. The pipeline is meant to flexible so the same step can be run with different LLM's and write their output to the same
metadata file. This way comparing responses is easy, and can tweak prompts
accordingly. A Web UI will be built as well to help with this.

A very long term goal would be to build a protocol between 'brains'. Having
them be fully encrypted and running LLM under FHE. This also would mean some kind
of access control scheme, so friends could have more access than a random person.
And things private to me remain private to me. Other than that I would be happy
to publish parts of my 'brain'.

## Install

To install dependencies:

```bash
bun install
```

Set up ENV vars

```bash
cp .env.example .env

# Fill in the values
BRAIN_NAME="chroma-db-collection-name" # the name for your chroma db collection
BRAIN_STORAGE_ROOT="/path/to/your/brain/storage/root" # where you want the files to be stored
OPENAI_API_KEY='sk-<your-openai-api-key>' # your open ai key
```

To run web server

```bash
bun dev
```
