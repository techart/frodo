frodo - консольная утилита для взаимодействия с [frontend](https://github.com/techart/frontend-blank)

Описание использования [см. вики](https://github.com/techart/frodo/wiki)

## Коды возврата

* 10 - не найден frontend (т.е. мы непонятно где находимся)
* 11 - не найден frontend, не правильно указан путь в .workspace_config
* 20 - что-то пошло не так во время установки frontend-blank
* 21 - что-то пошло не так во время обновления frontend-blank
* 30 - ошибка во время сборки (сборка прошла, но есть ошибки)
* 31 - критические ошибки в процессе сборки в самом собрщике
* 1 - любая другая ошибка