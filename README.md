# Chunky

Chunky is a distributed game framework that allows multiple game servers to be strung together to create a single seamless dynamic world.

This repository contains the core Chunky library as well as an example of using Chunky to run a distributed Minecraft Server (using Bungeecord and Spigot as backends).

Our full report and design can be found [here](https://github.com/omegablitz/chunky/raw/master/report.pdf).

<br />

<p align="center">
<img src="https://raw.githubusercontent.com/omegablitz/chunky/master/system-diagram.png" alt="chunky-system-diagram" width="400" />
</p>

## Running

Make sure the following is installed and in your path

- [JDK 1.8](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) (to compile plugins)
- [Docker](https://store.docker.com/search?type=edition&offering=community) (either Community or Enterprise)
- If on Windows or Mac, you need `make` to run the Makefile

Then, in the root directory of Chunky,

```bash
make all
```

(Use the Docker Quickstart Terminal if using the Windows Docker Toolbox)

Subsequent unmodified runs can be started with the `make run` target.

The Minecraft client can be now connected to `localhost:4444` and a visualization of the distributed chunks can be seen in a browser at `localhost`.

(If on Docker Toolbox, replace `localhost` with the IP Address of the Virtual Machine)

## Citation

If you use our code / design in your academic work, please cite the following:

```
@misc{welling2018chunky,
  author = {Aashish Welling and Shreyas Kapur},
  title = {Chunky: A Dynamically Sharded Distributed Multiplayer Game Framework},
  year = {2018},
  howpublished = {\url{https://github.com/omegablitz/chunky}}
}
```

## License

Please contact the authors for license information.

Bungeecord and Spigot are copyrights of md_5 (2012).

