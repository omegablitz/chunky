OS := $(shell uname)

ifeq ($(OS),CYGWIN_NT-10.0)
	GRADLE := ./gradlew.bat
else
	GRADLE := ./gradlew
endif

clean:
	(cd bukkit && $(GRADLE) clean)
	(cd world_slave && ./clean.sh)
	(cd chunky_proxy && ./clean.sh)
	(cd chunky_manager && ./clean.sh)
	(cd world_host && ./clean.sh)

plugin:
	(cd bukkit && $(GRADLE) jar)
	mkdir -p world_slave/rootfs/plugins
	rm -f world_slave/rootfs/plugins/Chunky*.jar
	cp bukkit/build/libs/*.jar world_slave/rootfs/plugins

proxy:
	(cd bungee_plugin && $(GRADLE) jar)
	mkdir -p bungee/rootfs/plugins
	rm -f bungee/rootfs/plugins/Chunky*.jar
	cp bungee_plugin/build/libs/*.jar bungee/rootfs/plugins
	(cd bungee && ./build.sh)

manager:
	(cd chunky_manager && ./build.sh)

world:
	(cd world_host && ./create.sh)

slave:
	(cd world_slave && ./build.sh)

run:
	(cd compose && docker-compose up)

all: world plugin slave proxy manager run

fresh: clean all
