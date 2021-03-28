---
title: "Java 中的多重分派与访问者模式"
date: 2020-12-20T20:20:30+08:00
---

# 什么是双重分派

## 什么是分派（dispatch）

首先我们需要理解「分派」的含义。分派就是将方法调用与对应的具体方法绑定起来。而判断的依据有两点，这两者可称为「宗量」：

1. 方法的接收者，也就是哪个对象调用了这个方法
2. 方法的参数，调用方法时传递过来的参数

而不同的判断方法也就产生了不同的分派类型：

1. 静态分派 V.S. 动态分派

2. 单重分派 V.S. 多重分派

下面以我的理解简单地总结一下这几个名词的含义：

**静态分派**：静态分派在编译期进行，只根据宗量的静态类型进行判断，在编译完成后不会发生改变。也可称为「编译期多态」。

**动态分派**：动态分派在运行期进行，根据宗量的动态类型来判断需要调用哪个方法。也称「运行时多态」。

**多重分派**：虽然说 `multiple` 是「多重」的意思，但是实际上也可称为「双重分派」。多重分派就是同时根据两种宗量的类型进行判断。

**单重分派**：单重分派就是只根据其中一种宗量进行判断。

所以其实这两组词是从两个不同的角度来描述分派的类型，并不冲突。

## Java 中的分派机制

在网上很多博客说 Java 中是单重分派；也有人说 Java 中实际上是静态双重分派，动态单重分派。下面是我的推论和总结。

Java 中的重载机制，是静态分派，其根据方法传入参数的静态类型进行判断，而方法的接收者，也直接在编译期就确定。所以是静态的双重分派。

而重写机制，肯定是动态分派了。但是其只根据方法接收者的动态类型进行判断。并不会根据方法参数的动态类型进行判断。所以是动态的单重分派。

那如果一个方法同时被重写和重载了呢，那这个方法属于什么分派机制呢？我认为，重写和重载本来就分别是编译期和运行期的多态机制，就是分开进行讨论的，在程序不同生命周期时间段的分派机制直接分开讨论并进行定义就好了。

## 访问者模式与伪双重分派

虽然说 Java 在编译期表现出了多重分派，但是也只能定性为单重分派语言，而这在设计代码时就会引起一些不便：在调用方法时无法根据参数的动态类型来分派对应的方法。所以我们只能曲线救国，可以通过以下两种方式实现伪动态双重分派。

### instanceof

在方法内部可以通过 Java 的 `instanceof` 关键字来判断对象的动态类型。通过分支选择来进行对应的处理操作。但是这种思路会让处理代码变得十分臃肿，而且违背了「开闭原则」。每次要新增一个被处理类时，就要修改代码新增一个分支进行处理。具体的实现方法很简单，不赘述。

### 访问者模式

设计模式中的「访问者模式」就是通过利用伪双重分派来实现的。主要思路如下：

设调用方为「类 A 」，被调用方为「类 B 」。通过反转调用方和被调用方，让类 A 重写方法来调用类 B 的重载方法。通过 this 变量将类 A 的动态类型传递给类 B 的重载方法，实现了伪双重分派。

在下面这个例子中，我们想让 `Player.play()` 方法根据 `Instrument` 的动态类型来分别调用对应的重载方法，从而进行不同的处理：

```java
class Player {
    void play(Instrument instrument) {
        System.out.println("instrument notes");
    }

    void play(Violin violin) {
        System.out.println("player starts playing violin");
        violin.note();
    }

    void play(Piano piano) {
        System.out.println("player starts playing piano");
        piano.note();
    }
}

class Instrument {
    void note() {
        System.out.println("instrument notes");
    }

    void accept(Player player) {
        player.play(this);
    }
}

class Violin extends Instrument {
    @Override
    public void note() {
        System.out.println("violin notes");
    }

    @Override
    public void accept(Player player) {
        player.play(this);
    }
}

class Piano extends Instrument {

    @Override
    public void note() {
        System.out.println("piano notes");
    }

    @Override
    public void accept(Player player) {
        player.play(this);
    }
}

public class Main {

    public static void main(String[] args) {
        Player player = new Player();
        System.out.println("-------双重分派-------");
        Instrument[] instruments = {new Violin(), new Piano()};
        for (Instrument instrument : instruments) {
            instrument.accept(player);
        }

        System.out.println("-------单重分派-------");
        for (Instrument instrument : instruments) {
            player.play(instrument);
        }
    }
}
// 结果
/*
	-------双重分派-------
	player starts playing violin
	violin notes
	player starts playing piano
	piano notes
	-------单重分派-------
	instrument notes
	instrument notes
*/
```

从上方的代码运行结果可以得知，在调用重载方法时，不会根据对象的动态类型进行判断，而是根据静态类型判断，只会调用 `play(Instrument)` 方法。当然，我们在重载 `Player` 的方法时可以直接调用 `Instrument.note()` 方法，让编译器去调用子类重写后的方法。

但是使用双重分派的意义在于， 把具体的处理逻辑放在调用者 `Player` 类的方法中，减少对 `Instrument` 的实现类的修改。事实上 `Instrument` 的子类只需要实现一个 `accept(Player)` 方法即可。

访问者模式的出现基本上也就是因为 Java 这类语言的单重分派特性吧。如果是多重分派的语言，就可以直接利用语言特性了。

参考文章：

1. [面向对象语言的多分派、单分派、双重分派](https://www.cnblogs.com/youxin/archive/2013/05/25/3099016.html)
2. [What is dispatching in JAVA?](https://stackoverflow.com/questions/5508274/what-is-dispatching-in-java)