#!/bin/sh

CWD=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# curl https://raw.githubusercontent.com/redis/redis/6.0/redis.conf > $CWD/redis.conf

if [ "$1" = "--auth" ]; then 
  shift
  echo "...using authentication"
  CONF=/usr/local/etc/redis.conf
  OPTS="-v $CWD/redis.conf:$CONF"
fi

docker run -it --rm --name redis $OPTS -p 6379:6379 redis $CONF $@
