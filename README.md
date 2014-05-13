state flow

```
[emitter] -----.
[emitter] ----.|
[emitter] ---.||
             |||
             |||
        [state tracker]
```

emitted state is collected on an tunable timeout.

__Assumption 1:__
Cascading state changes should all arrive at the state tracker
on the same tick

issues

rewinding the stack when something has been removed.


