docker volume rm minecraft_world_playerdata
docker volume rm minecraft_world_data
docker volume rm minecraft_world_region

docker volume create minecraft_world_playerdata
docker volume create minecraft_world_data
docker volume create minecraft_world_region

docker run --mount source=minecraft_world_playerdata,destination=/playerdata \
           --mount source=minecraft_world_data,destination=/data \
           --mount source=minecraft_world_region,destination=/region \
           --name helper busybox true

docker cp world/playerdata/. helper:/playerdata
docker cp world/data/. helper:/data
docker cp world/region/. helper:/region

docker rm helper
