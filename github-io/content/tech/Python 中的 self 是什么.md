---
title: "Python 中的「self」是什么？"
date: 2021-03-08T12:37:42+08:00
---
# Python 中的"self"是什么

在使用 `pycharm` 编写 Python 时，自动补全总会把函数定义的第一个参数定义为 `self` 。遂查，总结如下：

1. `self` 大体上和静态语言如 Java 中的 `this` 关键字类似，用于指代实例变量。只是在 Python 中需要主动定义在函数的参数中。但是通过实例调用方法时，无须传入 `self` 参数。
2. `self` 不是关键字，只是一种官方推荐写法，也可以写成其他的名称，但是很容易造成误解，所以不推荐。

由上方的知识可知：如果一个函数如果不是定义在类中，那么就不需要定义 `self` 变量了。即使定义了，也会作为一个普通的参数使用，参考下方的代码：

```python
def outer_func(self, val2):
    print(self, "\n" + val2)

outer_func("just a common parameter", "another common parameter")

# 执行结果
# just a common parameter 
# another common parameter
```

