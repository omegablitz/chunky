package io.github.revalo.ChunkyProxy;

import java.lang.reflect.Field;

public class ReflectionUtil {
    public ReflectionUtil() {
    }

    public static Field getField(Class<?> clazz, String fname) throws Exception {
        Field f = null;
        try {
            f = clazz.getDeclaredField(fname);
        }
        catch (Exception e) {
            f = clazz.getField(fname);
        }
        f.setAccessible(true);
        Field modifiers = Field.class.getDeclaredField("modifiers");
        modifiers.setAccessible(true);
        modifiers.setInt(f, f.getModifiers() & -17);
        return f;
    }

    public static void setObject(Class<?> clazz, Object obj, String fname, Object value) throws Exception {
        ReflectionUtil.getField(clazz, (String)fname).set(obj, value);
    }
}
