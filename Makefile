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
	(cd world_host && ./clean.sh)

plugin:
	(cd bukkit && $(GRADLE) jar)
	mkdir -p world_slave/rootfs/plugins
	rm -f world_slave/rootfs/plugins/Chunky*.jar
	cp bukkit/build/libs/*.jar world_slave/rootfs/plugins

world:
	(cd world_host && ./create.sh)

slave:
	(cd world_slave && ./build.sh)

proxy:
	(cd chunky_proxy && ./build.sh)

run:
	(cd compose && docker-compose up)

all: world slave proxy run

fresh: clean all
