export class Deviant {
  controller: string;
  value: string;

  constructor(controller: string, val: string) {
    this.controller = controller;
    this.value = val;
  }
}
interface DeviantMap {
  [key: string]: Array<Deviant>;
}

export namespace DeviantUtil {
  export function deviantsMapped(deviants: Deviant[]): string {
    const instances: DeviantMap = deviants.reduce((acc: DeviantMap, obj) => {
      const key = obj.value;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);

      return acc;
    }, {});

    const results: string[] = [];
    for (const key in instances) {
      if (instances.hasOwnProperty(key)) {
        const instance = instances[key];
        const allControllers = instance
          .map(i => i.controller)
          .sort((a, b) => a.localeCompare(b))
          .join(', ');

        results.push(`<strong>${allControllers}:</strong> ${key}`);
      }
    }

    return results.join('<br/>');
  }
}
