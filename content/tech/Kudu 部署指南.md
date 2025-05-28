---
title: "Kudu 部署指南"
date: "2020-08-01"
tags: ["大数据","nosql"]
categories: ["数据库"]
toc: true
---



# 1. Kudu的原理

## 1.1 概述

Kudu是一个类似Hbase的列式存储分布式数据库，它的定位介于hdfs和hbase之间。

- `hdfs`：使用列式存储，适合OLAP，不支持单条纪录级别的更新操作，随机读写性能差，不适合用来作实时查询。
- `hbase`：可以高效地随机读写，适用OLTP，但是不适用于SQL，且大数据量时读性能较差。

Kudu就是结合了两者的优点，平衡了两者的缺点。从而同时在OLTP和OLAP中都提供较好的性能。这样就无需为了解决以上两者的缺点而搭建两种架构。

## 1.2 基本概念

![img](D:\同步文档\笔记\大数据\kudu.assets\2020042021.png)

- `Table`：是一张表，具有全局的主键，一张table可以分为多个段，即`tablet`。

- `Tablet`：一个tablet是一张表连续的一个段，类似于关系型数据库的`partition`分区。

- `Tablet server`：存储tablet，并且向客户端提供读取数据的服务。

  对于指定的tablet，有一个server作为leader，基余server作为follower副本。只有leader处理写请求，follower负责和leader同步数据，并且提供读服务。

- `Master`：主要用于管理元数据，监听`tserver(tablet server)`的状态。当client发出请求时，其先对请求做校验，再分配tserver给client进行请求。



# 2. Kudu的安装

## 2.1 前置条件

以下是官方文档中给出的一些条件：

### 硬件

- 至少一个主机来作为Kudu的`Master`节点，`Master`节点数必须是奇数，推荐配置1个或者3个。

- 至少一个主机来作为`tablet`节点，如果需要备份复制，那么至少需要3个服务器

  > `2k`个数量的Master节点和`2k-1`个节点的容错等级是一样的。4个节点和3个节点一样，只能容忍一个错误。2个节点则不能容错。（这也是为什么官方推荐1个或3个节点的原因）

所以使用1台服务器也可以进行基本的Kudu的安装与运行

### 操作系统

#### Linux

- `RHEL / CentOS 6.6+` or `Ubuntu 16 18` or `Debian 8`
- ntp服务
- `xfs`/`ext4`格式的磁盘
- 

#### Windows

- 不支持

### 磁盘

- 如果能使用SSD，会显著地改善Kudu的延迟
- 至少`50GB`以上的磁盘空间，（实测想要完整编译，至少需要90GB以上）

### Java

- JDK8 以上，但是不需要JRE

## 2.2 源码编译

Kudu虽然提供了`Docker`的运行方式，但是官方建议只用于测试和学习，并不推荐在正式环境使用`Docker`运行。所以最好从源码编译一遍。

> 编译需要使用到C++11的编译器（GCC4.8)

笔者使用的是`CentOS7.7`，以下基于该系统进行说明。

### CentOS

CentOS 7.0 以上的版本就需要安装`Red Hat Developer Toolset`包用于获取`C++`编译器。

1. 安装依赖

   ```bash
   $ sudo yum install autoconf automake cyrus-sasl-devel cyrus-sasl-gssapi \
     cyrus-sasl-plain flex gcc gcc-c++ gdb git java-1.8.0-openjdk-devel \
     krb5-server krb5-workstation libtool make openssl-devel patch \
     pkgconfig redhat-lsb-core rsync unzip vim-common which
   ```

2. 笔者的系统是`CentOS 7.7`，所以需要安装Toolset。

   ```bash
   $ DTLS_RPM=rhscl-devtoolset-3-epel-6-x86_64-1-2.noarch.rpm
   $ DTLS_RPM_URL=https://www.softwarecollections.org/repos/rhscl/devtoolset-3/epel-6-x86_64/noarch/${DTLS_RPM}
   $ wget ${DTLS_RPM_URL} -O ${DTLS_RPM}
   $ sudo yum install -y scl-utils ${DTLS_RPM}
   $ sudo yum install -y devtoolset-3-toolchain
   ```

   官网给出的url已经失效，安装失败。但是经验证，没有安装也能正常编译。猜测是只需要安装了`gcc`并且版本大于4.8就可以了，可以使用`gcc --version`命令查看版本。

   ```bash
   $ gcc --version
   
   gcc (GCC) 8.3.1 20191121 (Red Hat 8.3.1-5)
   Copyright (C) 2018 Free Software Foundation, Inc.
   This is free software; see the source for copying conditions.  There is NO
   warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
   
   ```

3. 从github仓库中获取源码

   ```bash
   $ git clone https://github.com/apache/kudu
   ```

4. 使用`build-if-necessary.sh`脚本可以构建任何缺失的第三方依赖。需要使用到Python，本文中安装的是`python 3.6`。

   ```bash
   $ build-support/enable_devtoolset.sh thirdparty/build-if-necessary.sh
   ```

   然后进行一段漫长的等待过程。

5. 第4步完成后才能进进正式的编译过程，选择一个除了kudu根目录以外的输出目录，进行编译：

   ```bash
   $ mkdir -p build/release
   $ cd build/release
   $ ../../build-support/enable_devtoolset.sh ../../thirdparty/installed/common/bin/cmake -DCMAKE_BUILD_TYPE=release --DNO_TESTS=1 ../..
   $ make -j4
   ```

   `--DNO_TEST=1`参数的作用是在编译时跳过测试工作的编译，否则编译结果将十分巨大。

   > 安装时可以使用以下参数来跳过指定的组件：
   >
   > - `-DKUDU_CLIENT_INSTALL=OFF` 跳过kudu客户端的安装
   > - `-DKUDU_TSERVER_INSTALL=OFF`跳过tserver的安装
   > - `-DKUDU_MASTER_INSTALL=OFF`跳过master的安装
   >
   > 假如某个服务器只作为tserver使用，那么可以跳过master的安装以减少磁盘资源占用并加快安装过程。

   编译过程耗时也十分久。喝上一杯茶🍵慢慢等待。

6. 完成编译后，构建可执行文件，库文件和头文件。进入上一步编译的输出目录，运行下面的命令进行构建。用`DESTDIR=xxx`指定自己想要输出的位置，如果不指定则默认输出到`/usr/local/`目录下面。

   ```bash
   sudo make DESTDIR=/home/kudu install
   ```

   至此最基本的编译安装就完成啦😊！

## 2.3 配置Kudu

我们可以通过在命令行启动时传递参数来对Kudu进行配置，当参数过多时，也可在启动时使用`–-flagfile=<file>`参数来引用配置文件。更奇妙地是，在配置文件中还可以通过`--flagfile=<file>`来再次引用另一个配置文件，这样配置参数就相当灵活。

`Master`和`Tablet`节点的配置可以放在同一个配置文件中，它们会自动识别哪些是属于自己的配置参数。配置参数的格式为`-–flag=xxx` ，前缀可以用一个或者二个`-`都OK。

### 2.3.1 配置目录

每个节点都需要手动配置目录。

- `--fs_wal_dir`：用来配置Kudu的写前日志`WAL`（Write-Ahead Log）的输出目录。

- `--fs_metadata_dir`：配置Kudu每个tablet的元数据的存放目录

  建议这些目录放在一个高性能的、有高带宽的磁盘上，例如SSD。如果`--fs_metadata_dir`没有指定，那么元数据会放在`WAL`的输出目录。

- `--fs_data_dirs`：指定Kudu用于存放数据块的目录。可以通过`,`分隔添加多个目录，Kudu会把数据平均地存在这些目录中，如果不指定该参数，也是会把数据块放在`WAL`的输出目录中。

> `--fs_wal_dir`和`--fs_metadata_dir`可以设置为`--fs_data_dirs`给出的目录列表中的某一个目录，但是不能是任何目录列表中目录的子目录。

每一个目录都只能被一个Kudu进程使用，所以多个Kudu进程要分别设置属于自己的各种目录。否则启动可能会失败。

以上是一些最基本的设置，更多关于Master节点的配置可在官方网站查阅：[kudu-Master配置项](https://kudu.apache.org/docs/configuration_reference.html#kudu-master_supported)

## 2.4 部署实战

现在有5台服务器资源，经考虑，部署1个Master节点，3个Tablet节点。部署情况如下：

| 服务器IP     | 内存 | 磁盘                                | 部署服务    |
| ------------ | ---- | ----------------------------------- | ----------- |
| 120.40.185.* | 16GB | ESSD 云盘100GB <br />ESSD 云盘500GB | Kudu Tablet |
| 116.62.161.* | 16GB | ESSD 云盘100GB <br />ESSD 云盘500GB | Kudu Tablet |
| 121.41.10.*  | 16GB | ESSD 云盘100GB <br />ESSD 云盘500GB | Kudu Tablet |
| 112.124.30.* | 16GB | ESSD 云盘100GB <br />ESSD 云盘100GB | Kudu Master |

### 2.4.1 基本过程

先分别在四台机上安装Kudu，由于每台服务器只提供一个Master或Tablet节点，所以在安装时可以跳过不需要的部分，这样可以减少对系统资源的占用。安装过程参考上文。

在安装完之后，分别编写配置文件：

```shell
# tserver配置

--fs_wal_dir=/home/kudu/kudu_data/tserver/wal
--fs_data_dirs=/home/kudu/kudu_data/tserver/data
--fs_metadata_dir=/home/kudu/kudu_data/tserver/metadata
--log_dir=/home/kudu/kudu_data/tserver/logs
--tserver_master_addrs=112.124.30.113:7051
--webserver_doc_root=/home/kudu/kudu/www

# master 配置
--fs_wal_dir=/home/kudu/kudu_data/master/wal
--fs_data_dirs=/home/kudu/kudu_data/master/data
--fs_metadata_dir=/home/kudu/kudu_data/master/metadata
--log_dir=/home/kudu/kudu_data/master/logs
--webserver_doc_root=/home/kudu/kudu/www
--trusted_subnets=0.0.0.0/0
```

`master`和`tserver`的前四个配置是在`2.3`小节提到的基本配置参数。

`--webserver_doc_root`是为了能在8051端口看到Kudu的Master节点的一些详细信息（tserver节点的默认端口是8050）。需要指定静态文件的路径，否则在访问8051会报错：

**Static pages not available. Configure KUDU_HOME or use the --webserver_doc_root flag to fix page styling.**

由报错信息可知，也可以通过设置`KUDU_HOME`环境变量来解决，但是笔者在实践时这一方法失效了，所以采取了第2种方法。同时这个WebUI的访问端口也可以通过`–-webserver_port`参数来修改。

tserver节点需要额外配置一个`--tserver_master_addrs`参数，指定一串master节点地址的数组。用于将tserver连接到mastser节点。

`–trusted_subnets`参数设置在master上，为了让master节点能够接受tserver节点的连接请求，这里设为`0.0.0.0/0`接受所有的ip。当然也可以只单独添加其他节点的ip。

启动后进入master节点的8051端口，点击`Tablet Servers`可以看到节点已经连上

![image-20200811160001948](D:\同步文档\笔记\大数据\kudu.assets\image-20200811160001948.png)

# 3. 模式设计

Kudu的表格模型结构和传统关系型数据库的模型类似。但是Kudu表的设计要注意的地方又和这些`RDBMS`不太一样。在Kudu中建表时要着重关注以下3点：

1. 列设计
2. 主键设计
3. 分区设计

当然前两点在`RDBMS`中也经常涉及到。

## 3.1 完美的模式

Kudu的官方网站中介绍了一个完美的模式`(Schema)`应该满足哪些条件：

1. 数据的分布情况能够使每个服务器接收的读写请求量都差不多，这样每台服务器的压力都不会太大，也不会太小。这取决于分区的设计。
2. Tablets能够以可预测的速度平缓地增长，并且读取Tablets的耗时不会发生太大的变化。这也很大程度上受分区的影响。
3. 读取操作只扫描查询所需要的数据。这个条件一方面取决于主键的设计，另一方面也会受通过分区设计进行的分区裁剪的影响。

## 3.2 列设计

Kudu支持以下列数据类型：

- `BOOL`：布尔类型
- `INT8`：8位有符号整数
- `INT32`：32位有符号整数
- `INT64`：64位有符号整数
- `DATE`：32位的天数，以Unix时间戳表示
- `UNIXTIME_MICROS`：64位的毫秒数，以Unix时间戳表示
- `FLOAT`：32位浮点数
- `DOUBLE`：64位浮点数
- `DECIMAL`：固定精度数字类型
- `VARCHAR`：不定长字符串
- `STRING`：UTF-8编码的不限长字符串，最大存储64KB的数据（未压缩）
- `BINARY`：二进制数据，最大64KB（未压缩）

Kudu是使用列式存储的，所以在设计表的时候，最好能够为每一个列指定最合适的数据类型，而不是一股脑地全部设为`STRING`或者`BINARY`之类的。



