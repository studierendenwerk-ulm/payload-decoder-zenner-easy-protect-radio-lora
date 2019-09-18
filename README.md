# JavaScript payload decoder for ZENNER's EASY PROTECT Radio smoke detector

This decoder interprets the payload of ZENNER's EASY PROTECT Radio smoke detectors. It was developed to be used in The Things Network, adaption for other setups should be easy.

Development was based on ZENNNER's documentation, titled:
* LoRa radio packet definitions version 1.13
* EASY PROTECT Radio Information for system integrators firmware v1.6.0

Verification was done using ZENNER's EASY PROTECT Radio smoke detector FIXME.

A small frontend to test the decocer is available [here](https://studierendenwerk-ulm.github.io/payload-decoder-zenner-easy-protect-radio-lora/index.html).


## Implemented features

Interpretation of packet types:
* Synchronous packets 9.1 and 9.2 (SP9.1 and SP9.2).
* Asynchronous packet 1 (AP1).


## Missing features
* Interpretation of synchronous packet 1 (SP1). Documentation, i.e. byte/bit order, is unclear.


---


**Studierendenwerk Ulm** | Aron Lanza, Simon Lüke | [Lizenz](./LICENSE)

[![Logo Studierendenwerk Ulm](https://studierendenwerk-ulm.de/wp-content/themes/studentenwerk/assets/img/logo.png)](https://studierendenwerk-ulm.de/)
