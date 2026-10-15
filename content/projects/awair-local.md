## At a glance

Awair Local is a Homebridge plugin that reads supported Awair monitors over their local API and exposes temperature, humidity, carbon dioxide, volatile organic compounds, and particulate matter to Apple Home.

## Background and opportunity

While working at Awair, I saw that air-quality monitors could remain physically useful long after the software or cloud service around them changed. This personal account is the origin of the project: preserve a direct, local path from a device a person owns to the home system they already use. The published plugin implements that idea without Awair cloud credentials.

## Business justification

Local access extends the useful life of installed hardware, reduces dependence on a vendor service, and gives Homebridge users one place for automations and alerts. Building a focused bridge was more practical than asking every home platform to support every device model directly.

## Goals, success measures, and non-goals

The product goal is dependable local visibility for supported Awair readings. Useful measures include successful discovery, stable polling, correct HomeKit value ranges, and recovery after device or network interruptions. It is not a replacement for Awair firmware, a remote monitoring service, or an air-quality diagnosis tool.

## Personas and stakeholders

- **Awair owners** want to keep using hardware on their local network.
- **Homebridge operators** need predictable setup, logs, and migration behavior.
- **Home occupants** need readable measurements and trustworthy alert thresholds.
- **Maintainers** need compatibility boundaries that can be tested without private services.

## Requirements

- Read supported measurements from the device's documented local endpoints.
- Support automatic discovery and explicit host configuration.
- Keep device addresses and readings on the local network.
- Clamp only values presented to HomeKit while preserving the source reading for diagnostics.
- Retain configuration compatibility where practical and document migrations.

## Solution and experience

The plugin is a Homebridge v2 dynamic platform. It discovers and verifies compatible devices, polls the local API, maps readings to HomeKit services, and caches accessories across restarts. Manual configuration remains available for networks where devices advertise a hostname but cannot be enumerated.

## Decisions and tradeoffs

Local-only communication improves privacy and resilience but limits access to the home network and depends on the device's local API remaining enabled. Supporting discovery and manual hosts increases reliability across network setups at the cost of more configuration paths to maintain.

## Risks and mitigations

- Device models and network advertisements vary; verify candidates against the device configuration endpoint.
- HomeKit characteristic ranges can differ from sensor output; constrain the HomeKit-facing value and retain diagnostic fidelity.
- Local networks change; cache stable device identity and accept host updates.

## Outcomes and evidence

**Verified outcome:** The public repository identifies the plugin as Homebridge verified, and its package includes automated lint, test, installation, and packaging checks.

**Personal account:** The motivation came from my experience at Awair and my interest in keeping owned hardware useful without an unnecessary cloud dependency.

## Build it

Install Homebridge 2 on Node.js 22 or 24, enable the Awair Local API, then install `homebridge-awair-local` from the Homebridge UI or npm. The public README documents discovery, manual configuration, migration, supported readings, and development commands.

## What I learned

A small integration can carry a substantial product promise: ownership should continue to mean something when a cloud service is unavailable.

## What remains

Continue testing new Homebridge and Node releases, maintain device discovery across network environments, and make compatibility limits explicit as upstream platforms evolve.
