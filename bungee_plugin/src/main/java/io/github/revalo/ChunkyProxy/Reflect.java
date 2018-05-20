package io.github.revalo.ChunkyProxy;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

public class Reflect {
    public static Field getField(Class<?> clazz, String fname) throws Exception {
        Field f = null;
        try {
            f = clazz.getDeclaredField(fname);
        }
        catch (Exception e) {
            f = clazz.getField(fname);
        }
        Reflect.setAccessible(f);
        return f;
    }

    public static void setAccessible(Field f) throws Exception {
        f.setAccessible(true);
        Field modifiers = Field.class.getDeclaredField("modifiers");
        modifiers.setAccessible(true);
        modifiers.setInt(f, f.getModifiers() & -17);
    }

    public static Method getMethod(Class<?> clazz, String mname) throws Exception {
        Method m = null;
        try {
            m = clazz.getDeclaredMethod(mname, new Class[0]);
        }
        catch (Exception e) {
            try {
                m = clazz.getMethod(mname, new Class[0]);
            }
            catch (Exception ex) {
                return m;
            }
        }
        m.setAccessible(true);
        return m;
    }

    public static /* varargs */ Method getMethod(Class<?> clazz, String mname, Class<?> ... args) throws Exception {
        Method m = null;
        try {
            m = clazz.getDeclaredMethod(mname, args);
        }
        catch (Exception e) {
            try {
                m = clazz.getMethod(mname, args);
            }
            catch (Exception ex) {
                return m;
            }
        }
        m.setAccessible(true);
        return m;
    }

    public static /* varargs */ Constructor<?> getConstructor(Class<?> clazz, Class<?> ... args) throws Exception {
        Constructor c = clazz.getConstructor(args);
        c.setAccessible(true);
        return c;
    }

    public static Enum<?> getEnum(Class<?> clazz, String enumname, String constant) throws Exception {
        Enum[] econstants;
        Class c = Class.forName(String.valueOf(clazz.getName()) + "$" + enumname);
        Enum[] arrenum = econstants = (Enum[])c.getEnumConstants();
        int n = arrenum.length;
        int n2 = 0;
        while (n2 < n) {
            Enum e = arrenum[n2];
            if (e.name().equalsIgnoreCase(constant)) {
                return e;
            }
            ++n2;
        }
        throw new Exception("Enum constant not found " + constant);
    }

    public static Enum<?> getEnum(Class<?> clazz, String constant) throws Exception {
        Enum[] econstants;
        Class c = Class.forName(clazz.getName());
        Enum[] arrenum = econstants = (Enum[])c.getEnumConstants();
        int n = arrenum.length;
        int n2 = 0;
        while (n2 < n) {
            Enum e = arrenum[n2];
            if (e.name().equalsIgnoreCase(constant)) {
                return e;
            }
            ++n2;
        }
        throw new Exception("Enum constant not found " + constant);
    }

    public static Object get(Class<?> c, String fname) throws Exception {
        return Reflect.getField(c, fname).get(null);
    }

    public static Object get(Object obj, String fname) throws Exception {
        return Reflect.getField(obj.getClass(), fname).get(obj);
    }

    public static Object get(Class<?> c, Object obj, String fname) throws Exception {
        return Reflect.getField(c, fname).get(obj);
    }

    public static void set(Class<?> c, String fname, Object value) throws Exception {
        Reflect.getField(c, fname).set(null, value);
    }

    public static void set(Object obj, String fname, Object value) throws Exception {
        Reflect.getField(obj.getClass(), fname).set(obj, value);
    }

    public static void set(Class<?> c, Object obj, String fname, Object value) throws Exception {
        Reflect.getField(c, fname).set(obj, value);
    }

    public static /* varargs */ Object invoke(Class<?> clazz, Object obj, String method, Class<?>[] args, Object ... initargs) throws Exception {
        return Reflect.getMethod(clazz, method, args).invoke(obj, initargs);
    }

    public static Object invoke(Class<?> clazz, Object obj, String method) throws Exception {
        return Reflect.getMethod(clazz, method).invoke(obj, new Object[0]);
    }

    public static /* varargs */ Object invoke(Class<?> clazz, Object obj, String method, Object ... initargs) throws Exception {
        return Reflect.getMethod(clazz, method).invoke(obj, initargs);
    }

    public static Object invoke(Object obj, String method) throws Exception {
        return Reflect.getMethod(obj.getClass(), method).invoke(obj, new Object[0]);
    }

    public static Object invoke(Object obj, String method, Object[] initargs) throws Exception {
        return Reflect.getMethod(obj.getClass(), method).invoke(obj, initargs);
    }

    public static /* varargs */ Object construct(Class<?> clazz, Class<?>[] args, Object ... initargs) throws Exception {
        return Reflect.getConstructor(clazz, args).newInstance(initargs);
    }
}
