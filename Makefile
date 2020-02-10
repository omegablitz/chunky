OS := $(shell uname)

ifeq ($(OS),CYGWIN_NT-10.0)
	GRADLE := ./gradlew.bat
else
	GRADLE := ./gradlew
endif

.PHONY: clean
clean:
	(cd bukkit && $(GRADLE) clean)
	(cd slave && ./clean.sh)
	(cd bungee_plugin && $(GRADLE) clean)
	(cd manager && ./clean.sh)
	(cd world && ./clean.sh)

.PHONY: plugin
plugin:
	(cd bukkit && $(GRADLE) jar)
	mkdir -p slave/rootfs/plugins
	rm -f slave/rootfs/plugins/Chunky*.jar
	cp bukkit/build/libs/*.jar slave/rootfs/plugins

.PHONY: proxy
proxy:
	(cd bungee_plugin && $(GRADLE) jar)
	mkdir -p bungee/rootfs/plugins
	rm -f bungee/rootfs/plugins/Chunky*.jar
	cp bungee_plugin/build/libs/*.jar bungee/rootfs/plugins
	(cd bungee && ./build.sh)

.PHONY: manager
manager:
	(cd manager && ./build.sh)

.PHONY: world
world:
	(cd world && ./create.sh)

.PHONY: slave
slave:
	(cd slave && ./build.sh)

.PHONY: run
run:
	(cd compose && docker-compose up)

.PHONY: all
all: world plugin slave proxy manager run

.PHONY: fresh
fresh: clean all
